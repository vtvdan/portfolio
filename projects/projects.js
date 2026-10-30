import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';
import { fetchJSON, renderProjects } from '../global.js';

// 1. Fetch projects data
const projects = await fetchJSON('../lib/projects.json');
const projectsContainer = document.querySelector('.projects');
const projectsTitle = document.querySelector('.projects-title');

// Render initial projects and update heading count
if (projects && projectsContainer) {
    renderProjects(projects, projectsContainer, 'h2');
    if (projectsTitle) {
        projectsTitle.textContent = `${projects.length} Projects`
    }
}

// Global state variables
let query = '';
let selectedYear = null;

// 2. Render reactive pie chart & legend
function renderPieChart(projectsGiven) {
    const svg = d3.select('#projects-pie-plot');
    svg.selectAll('*').remove();
    const legend = d3.select('.legend');
    legend.selectAll('*').remove();
    
    if (!projectsGiven.length || projectsGiven.length === 0) return;

    // Aggregate project count by year using d3.rollups
    let rolledData = d3.rollups(
        projectsGiven,
        (v) => v.length,
        (d) => d.year
    ); 
    
    let data = rolledData.map(([year, count]) => ({
        value: count,
        label: year,
    }));
    
    // Setup D3 generators & color dcale
    let sliceGenerator = d3.pie().value((d) => d.value);
    let arcData = sliceGenerator(data);
    let arcGenerator = d3.arc().innerRadius(0).outerRadius(50);
    let colors = d3.scaleOrdinal(d3.schemeTableau10);
    
    // Render slices (paths)
    arcData.forEach((d, i) => {
        let year = d.data.label;
        let isSelected = String(year) === String(selectedYear);

        let path = svg
            .append('path')
            .attr('d', arcGenerator(d))
            .attr('fill', colors(i))
            .attr('class', isSelected ? 'selected' : '');
        
        // Step 5: Click slice to filter projects by year
        path.on('click', () => {
            selectedYear = selectedYear === year ? null : year;
            filterAndRender();
        });
    }); 
    
    // Render legend items
    data.forEach((d, idx) => {
        let year = d.label;
        let isSelected = String(year) === String(selectedYear);

        let li = legend
            .append('li')
            .attr('style', `--color:${colors(idx)}`)
            .attr('class', isSelected ? 'selected' : '')
            .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`);
            
        // Click legend item to filter projects by year
        li.on('click', () => {
            selectedIndex = selectedIndex === year ? null : year;
            filterAndRender();
        });
    });
} 

// 3. Combined filter function (handles search query + selected year)
function filterAndRender() {
    if (!projects) return;

    let filtered = projects.filter((project) => {
        let matchesQuery = Object.values(project)
            .join('\n')
            .toLowerCase()
            .includes(query.toLowerCase());
        
        return matchesQuery;
    });
    
    // Re-render pie chart for currently searched projects
    renderPieChart(filtered);
    
    // Filter list further by selected year slice if active
    if (selectedYear !== null) {
        filtered = filtered.filter((p) => String(p.year) === String(selectedYear));
    }
    
    // Render project list
    renderProjects(filtered, projectsContainer, 'h2');
    if (projectsTitle) {
        projectsTitle.textContent = `${filtered.length} Projects`;
    }
} 

// Initial pie chart render
if (projects) {
    renderPieChart(projects);
}

// 4. Reactive search listener
const searchInput = document.querySelector('.searchBar');
searchInput?.addEventListener('input', (event) => {
    query = event.target.value;
    filterAndRender();
});