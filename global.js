console.log('IT’S ALIVE!');

function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

// Define page URLs and titles
let pages = [
    {url: '', title: 'Home'},
    {url: 'projects/', title: 'Projects'},
    {url: 'contact/', title: 'Contact'},
    {url: 'resume/', title: 'Resume'},
    {url: 'https://github.com/vtvdan', title: 'GitHub'}
]; 

// Determine base path for local server vs. GitHub Pages
const BASE_PATH = (location.hostname === "localhost" || location.hostname === "127.0.0.1")
  ? "/"                  // Local server
  : "/portfolio/";         // GitHub Pages repo name

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

// Step 4.2: Insert theme switcher UI at the top of <body>
document.body.insertAdjacentHTML(
  'afterbegin',
  `
	<label class="color-scheme">
		Theme:
		<select>
			<option value="light dark">Automatic</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
		</select>
	</label>`,
);

// Step 4.4-4.5: Select element and handle theme switching + localStorage persistence
const select = document.querySelector('.color-scheme select'); 

function setColorScheme(colorScheme) {
    document.documentElement.style.setProperty('color-scheme', colorScheme);
    select.value = colorScheme;
} 

// Load saved theme preference on page load if present
if ('colorScheme' in localStorage) {
    setColorScheme(localStorage.colorScheme);
} 

// Update theme and save choice to localStorage when changed
select.addEventListener('input', (event) => {
    const colorScheme = event.target.value;
    setColorScheme(colorScheme);
    localStorage.colorScheme = colorScheme;
});

// Step 5: Enhanced Contact Form Submission
let form = document.querySelector('form');

form?.addEventListener('submit', function (event) {
    event.preventDefault(); // Stop default browser submission 
    
    let data = new FormData(form);
    let params = []; 
    
    // Iterate over form fields and properly encode values
    for (let [name, value] of data) {
        params.push(`${name}=${encodeURIComponent(value)}`);
    } 
    
    // Construct mailto: URL with query parameters
    let url = `${form.action}?${params.join('&')}`; 
    
    // Open default mail client with prefilled data
    location.href = url;
});