-- =====================================================================
-- RFI NUMBER FORMAT PATCH: Remove zero-padding
-- Changes format from PROJ-001 to PROJ-1 for cleaner scaling
-- to thousands (PROJ-1, PROJ-2, ... PROJ-10000)
-- Does NOT affect rfi_start_number — that still works correctly.
-- Existing RFIs keep their old format; new ones get the new format.
-- =====================================================================

CREATE OR REPLACE FUNCTION public.generate_rfi_serial_no()
RETURNS trigger AS $$
DECLARE
  p_code         text;
  p_start_number integer;
  max_val        integer;
  parent_code    text;
BEGIN
  -- 1. Handle serial_no (per-day counter)
  IF NEW.serial_no IS NULL OR NEW.serial_no = 0 THEN
    SELECT COALESCE(MAX(serial_no), 0) + 1 INTO NEW.serial_no
    FROM public.rfis
    WHERE project_id = NEW.project_id AND filed_date = NEW.filed_date;
  END IF;

  -- 2. Handle rfi_no in custom_fields
  IF NEW.custom_fields IS NULL THEN NEW.custom_fields := '{}'::jsonb; END IF;

  IF NEW.custom_fields ->> 'rfi_no' IS NULL THEN
    -- Fetch project code and the admin-configured starting number
    SELECT code, COALESCE(rfi_start_number, 1)
    INTO p_code, p_start_number
    FROM public.projects WHERE id = NEW.project_id;

    p_code         := COALESCE(p_code, 'RFI');
    p_start_number := COALESCE(p_start_number, 1);

    IF NEW.parent_id IS NULL THEN
      -- Base RFI: start counting from rfi_start_number, never below it
      SELECT COALESCE(MAX((custom_fields->>'rfi_no_num')::integer), p_start_number - 1) + 1
      INTO max_val
      FROM public.rfis
      WHERE project_id = NEW.project_id AND parent_id IS NULL;

      max_val := GREATEST(max_val, p_start_number);

      -- Plain sequential number (no zero-padding)
      NEW.custom_fields := jsonb_set(
        NEW.custom_fields, '{rfi_no}',
        to_jsonb(p_code || '-' || max_val::text)
      );
      NEW.custom_fields := jsonb_set(NEW.custom_fields, '{rfi_no_num}', to_jsonb(max_val));
    ELSE
      -- Revision: ParentCode-R1, ParentCode-R2, ...
      SELECT custom_fields->>'rfi_no' INTO parent_code FROM public.rfis WHERE id = NEW.parent_id;
      IF parent_code LIKE '%-R%' THEN
        NEW.custom_fields := jsonb_set(
          NEW.custom_fields, '{rfi_no}',
          to_jsonb(split_part(parent_code, '-R', 1) || '-R' ||
                   (split_part(parent_code, '-R', 2)::integer + 1))
        );
      ELSE
        NEW.custom_fields := jsonb_set(NEW.custom_fields, '{rfi_no}', to_jsonb(parent_code || '-R1'));
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
