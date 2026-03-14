-- Restrict RFI edits and comment access based on assignment.
-- 1) If RFI is assigned, only assigned user can edit.
-- 2) If RFI is unassigned, consultants and filer can edit.
-- 3) If RFI is assigned, only filer + assigned user can access chat/comments.

ALTER TABLE public.rfis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- RFI UPDATE policy
DROP POLICY IF EXISTS "Authenticated users can update RFIs" ON public.rfis;
DROP POLICY IF EXISTS "Users can update editable RFIs" ON public.rfis;
CREATE POLICY "Users can update editable RFIs"
ON public.rfis
FOR UPDATE
USING (
  auth.role() = 'authenticated'
  AND (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
    OR (
      assigned_to IS NOT NULL
      AND auth.uid() = assigned_to
    )
    OR (
      assigned_to IS NULL
      AND (
        auth.uid() = filed_by
        OR EXISTS (
          SELECT 1
          FROM public.profiles p
          WHERE p.id = auth.uid() AND p.role = 'consultant'
        )
      )
    )
  )
)
WITH CHECK (
  auth.role() = 'authenticated'
  AND (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
    OR (
      assigned_to IS NOT NULL
      AND auth.uid() = assigned_to
    )
    OR (
      assigned_to IS NULL
      AND (
        auth.uid() = filed_by
        OR EXISTS (
          SELECT 1
          FROM public.profiles p
          WHERE p.id = auth.uid() AND p.role = 'consultant'
        )
      )
    )
  )
);

-- Comment policies (assignment-aware)
DROP POLICY IF EXISTS "Comments viewable by authenticated" ON public.comments;
DROP POLICY IF EXISTS "Users can insert comments" ON public.comments;
DROP POLICY IF EXISTS "Users can update own comments" ON public.comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON public.comments;

CREATE POLICY "Comments assignment-aware select"
ON public.comments
FOR SELECT
USING (
  auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1
    FROM public.rfis r
    WHERE r.id = comments.rfi_id
      AND (
        r.assigned_to IS NULL
        OR auth.uid() = r.filed_by
        OR auth.uid() = r.assigned_to
      )
  )
);

CREATE POLICY "Comments assignment-aware insert"
ON public.comments
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1
    FROM public.rfis r
    WHERE r.id = comments.rfi_id
      AND (
        r.assigned_to IS NULL
        OR auth.uid() = r.filed_by
        OR auth.uid() = r.assigned_to
      )
  )
);

CREATE POLICY "Comments assignment-aware update"
ON public.comments
FOR UPDATE
USING (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1
    FROM public.rfis r
    WHERE r.id = comments.rfi_id
      AND (
        r.assigned_to IS NULL
        OR auth.uid() = r.filed_by
        OR auth.uid() = r.assigned_to
      )
  )
)
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1
    FROM public.rfis r
    WHERE r.id = comments.rfi_id
      AND (
        r.assigned_to IS NULL
        OR auth.uid() = r.filed_by
        OR auth.uid() = r.assigned_to
      )
  )
);

CREATE POLICY "Comments assignment-aware delete"
ON public.comments
FOR DELETE
USING (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1
    FROM public.rfis r
    WHERE r.id = comments.rfi_id
      AND (
        r.assigned_to IS NULL
        OR auth.uid() = r.filed_by
        OR auth.uid() = r.assigned_to
      )
  )
);
