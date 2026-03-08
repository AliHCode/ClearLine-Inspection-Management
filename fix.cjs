const fs = require('fs');
const content = fs.readFileSync('src/index.css', 'utf8');

const startMatch = content.indexOf('/* ============================================\r\n   PHASE 8B: STRICT MOBILE OPTIMIZATION');
const endMatch = content.indexOf('/* ============================================\r\n   PHASE 8C: MOBILE POLISH & BUG FIXES');

const replacement = `/* ============================================
   PHASE 8D: NATIVE FLEX-WRAP OPTIMIZATION
   ============================================ */

@media (max-width: 768px) {
  /* Prevent horizontal scroll universally */
  body, #root {
    overflow-x: hidden;
    max-width: 100vw;
  }

  main {
    padding: 1rem !important;
  }

  /* Compress Dashboards neatly with flex-wrap */
  .dashboard-header {
    flex-wrap: wrap;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  .dashboard-section {
    padding: 1rem !important; 
    margin-bottom: 1rem !important;
  }

  /* Stat Cards Flex Setup */
  .stats-grid {
    gap: 1rem; 
  }

  .stat-card {
    padding: 1.25rem;
    flex: 1 1 100%;
  }

  /* Header Hiding Profile */
  .header-user-info {
    display: none !important;
  }
}

@media (max-width: 480px) {
  .app-header {
    padding: 0 1rem;
  }
  
  .dashboard-header h1 {
    font-size: 1.5rem;
  }
  
  /* Make mini-stats full width */
  .review-mini-stat-card {
    width: 100%;
  }
}

/* More targeted compression for mobile */
@media (max-width: 768px) {
  .dashboard-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }
  
  .review-mini-stats {
    flex-wrap: wrap; /* Let mini stats wrap */
    gap: 1rem;
  }
  
  .review-mini-stat-card {
    flex: 1 1 100%; /* Force full width */
    padding: 1rem;
  }
  
  .recent-files-list {
    padding: 0.5rem;
  }
  
  .file-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
  }
  
  .file-actions {
    width: 100%;
    justify-content: flex-end;
    margin-top: 0.5rem;
  }
  
  /* Force inputs and forms to behave */
  input, select, textarea {
    max-width: 100%;
    box-sizing: border-box;
  }
  
  .form-group {
    margin-bottom: 0.75rem;
  }
  
  .rfi-form-container {
    padding: 1rem;
  }
}

`;

if (startMatch !== -1 && endMatch !== -1) {
    const newContent = content.substring(0, startMatch) + replacement + content.substring(endMatch);
    fs.writeFileSync('src/index.css', newContent, 'utf8');
    console.log('Success CRLF');
} else {
    const altStart = content.indexOf('/* ============================================\n   PHASE 8B: STRICT MOBILE OPTIMIZATION');
    const altEnd = content.indexOf('/* ============================================\n   PHASE 8C: MOBILE POLISH & BUG FIXES');
    if (altStart !== -1 && altEnd !== -1) {
        const newContent2 = content.substring(0, altStart) + replacement + content.substring(altEnd);
        fs.writeFileSync('src/index.css', newContent2, 'utf8');
        console.log('Success LF');
    } else {
        console.log('Markers not found');
    }
}
