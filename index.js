import { fetchJSON, renderProjects, fetchGitHubData } from './global.js';

// 1. Fetch project data and slice the first 3
const projects = await fetchJSON('./lib/projects.json');
const latestProjects = projects ? projects.slice(0, 3) : [];

// 2. Select the container and render the 3 latest projects
const projectsContainer = document.querySelector('.projects');
if (projectsContainer && latestProjects.length > 0) {
    renderProjects(latestProjects, projectsContainer, 'h2');
}

// 3. Fetch GitHub profile data
const githubData = await fetchGitHubData('vtvdan'); 

// 4. Target container and populate stats
const profileStats = document.querySelector('#profile-stats');

if (profileStats) {
  profileStats.innerHTML = `
        <dl>
          <dt>Public Repos:</dt><dd>${githubData.public_repos}</dd>
          <dt>Public Gists:</dt><dd>${githubData.public_gists}</dd>
          <dt>Followers:</dt><dd>${githubData.followers}</dd>
          <dt>Following:</dt><dd>${githubData.following}</dd>
        </dl>
    `;
}