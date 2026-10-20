import { fetchJSON, renderProjects } from '../global.js';

// 1. Fetch project data from JSON
const projects = await fetchJSON('../lib/projects.json');

// 2. Select the projects container element 
const projectsContainer = document.querySelector('.projects');

// 3. Render all project cards dynamically
if (projects && projectsContainer) {
    renderProjects(projects, projectsContainer, 'h2');
} 

// 4. Update project title count dynamically (Step 1.6)
const projectsTitle = document.querySelector('.projects-title');
if (projectsTitle && projects) {
    projectsTitle.textContent = `${projects.length} Projects`;
}