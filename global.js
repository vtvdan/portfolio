console.log('IT’S ALIVE!');

function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

// Define page URLs and titles
let pages = [
    {url: 'index.html', title: 'Home'},
    {url: 'projects/', title: 'Projects'},
    {url: 'contact/', title: 'Contact'},
    {url: 'resume/', title: 'Resume'},
    {url: 'https://github.com/vtvdan', title: 'GitHub'}
]; 

// Determine base path for local server vs. GitHub Pages
const BASE_PATH = location.hostname === 'localhost' || location.hostname === '127.0.0.1' ? "/" : "/portfolio/";

// Create <nav> element and prepend to <body>
let nav = document.createElement('nav');
document.body.prepend(nav);

// Generate links, highlight current page, and handle external links
for (let p of pages) {
    let url = p.url;
    let title = p.title; 
    
    // Prefix relative URLs with BASE_PATH
    if (!url.startsWith('http')) {
        url = BASE_PATH + url;
    }
        
    // Create <a> element
    let a = document.createElement('a'); 
    a.href = url; 
    a.textContent = title; 
    
    // Highlight current page link automatically 
    if (a.host === location.host && a.pathname === location.pathname) {
         a.classList.add('current'); 
    }
    
    // Open external links (GitHub) in a new tab 
    if (a.host !== location.host) {
        a.target = '_blank';
    } 
    
    nav.append(a);
}