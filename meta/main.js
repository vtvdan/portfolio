import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

async function loadData() {
    const data = await d3.csv('loc.csv', (row) => ({
        ...row,
        line: Number(row.line),
        depth: Number(row.depth),
        length: Number(row.length),
        date: new Date(row.date + 'T00:00' + row.timezone),
        datetime: new Date(row.datetime),
    }));
    return data;
}

function processCommits(data) {
  return d3
    .groups(data, (d) => d.commit)
    .map(([commit, lines]) => {
      let first = lines[0];
      let { author, date, time, timezone, datetime } = first;
      let ret = {
        id: commit,
        url: 'https://github.com/vtvdan/portfolio/commit/' + commit,
        author,
        date,
        time,
        timezone,
        datetime,
        hourFrac: datetime.getHours() + datetime.getMinutes() / 60,
        totalLines: lines.length,
      };

      Object.defineProperty(ret, 'lines', {
        value: lines,
        // What other options do we need to set?
        // Hint: look up configurable, writable, and enumerable
        configurable: true,
        writable: true,
        enumerable: false,
      });

      return ret;
    });
}

function renderCommitInfo(data, commits) {
  const container = d3.select('#stats');
  container.selectAll('*').remove();
  
  const dl = container.append('dl').attr('class', 'stats');
  
  // Helper to wrap each stat label & number inside a <div> card
  function addStat(label, value) {
    const div = dl.append('div');
    div.append('dt').html(label);
    div.append('dd').text(value);
  }
  
  // Calculate metrics
  addStat('COMMITS', commits.length);
  addStat('FILES', d3.group(data, (d) => d.file).size);
  addStat('TOTAL <abbr title="Lines of code">LOC</abbr>', data.length);
  addStat('MAX DEPTH', d3.max(data, (d) => d.depth));
  addStat('LONGEST LINE', d3.max(data, (d) => d.length));
  
  const fileLengths = d3.rollups(
    data,
    (v) => d3.max(v, (d) => d.line),
    (d) => d.file
  );
  
  addStat('MAX LINES', d3.max(fileLengths, (d) => d[1]));
}

function renderScatterPlot(data, commits) {
  const width = 1000;
  const height = 600;
  const margin = { top: 10, right: 10, bottom: 30, left: 50 }; // left margin gives room for y-axis labels
  
  const usableArea = {
    top: margin.top,
    right: width - margin.right,
    bottom: height - margin.bottom,
    left: margin.left,
    width: width - margin.left - margin.right,
    height: height - margin.top - margin.bottom,
  };
  
  // Create SVG element
  const svg = d3
    .select('#chart')
    .append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .style('overflow', 'visible');
  
  // X scale (Time / Dates)
  const xScale = d3
    .scaleTime()
    .domain(d3.extent(commits, (d) => d.datetime))
    .range([usableArea.left, usableArea.right])
    .nice();
    
  // Y scale (Hours 0 to 24)
  const yScale = d3.scaleLinear().domain([0, 24]).range([usableArea.bottom, usableArea.top]);

  // Time of Day Color Scale
  const colorScale = d3.scaleSequential()
    .domain([0, 24])
    .interpolator((t) => {
      if (t <= 0.5) {
        return d3.interpolateRgb('#4682b4', '#ffa500')(t * 2);
      } else {
        return d3.interpolateRgb('#ffa500', '#4682b4')((t - 0.5) * 2);
      }
    });
    
  // Step 4.1 & 4.2: Radius Scale using d3.scaleSqrt for accurate area perception
  const [minLines, maxLines] = d3.extent(commits, (d) => d.totalLines);
  const rScale = d3
    .scaleSqrt()
    .domain([minLines, maxLines])
    .range([2, 30]); // Radii range between 2px and 30px
  
  // Step 4.3: Sort commits descending by totalLines so smaller dots draw on top of larger ones
  const sortedCommits = d3.sort(commits, (d) => -d.totalLines);

  // Add horizontal gridlines
  const gridlines = svg
    .append('g')
    .attr('class', 'gridlines')
    .attr('transform', `translate(${usableArea.left}, 0)`);
    
  gridlines.call(
    d3.axisLeft(yScale).tickFormat('').tickSize(-usableArea.width)
  );
  
  // Create axes
  const xAxis = d3.axisBottom(xScale).ticks(10);
  const yAxis = d3
    .axisLeft(yScale)
    .tickFormat((d) => String(d % 24).padStart(2, '0') + ':00');
    
  // Add X axis
  svg
    .append('g')
    .attr('transform', `translate(0, ${usableArea.bottom})`)
    .call(xAxis);
    
  // Add Y axis
  svg
    .append('g')
    .attr('transform', `translate(${usableArea.left}, 0)`)
    .call(yAxis);
    
  // Draw dots
  const dots = svg.append('g').attr('class', 'dots');
  
  dots
    .selectAll('circle')
    .data(sortedCommits)
    .join('circle')
    .attr('cx', (d) => xScale(d.datetime))
    .attr('cy', (d) => yScale(d.hourFrac))
    .attr('r', (d) => rScale(d.totalLines)) // Dynamic radius based on lines edited
    .attr('fill', (d) => colorScale(d.hourFrac))
    .style('fill-opacity', 0.7)
    .on('mouseenter', (event, commit) => {
      d3.select(event.currentTarget).style('fill-opacity', 1);
      renderTooltipContent(commit);
      updateTooltipVisibility(true);
      updateTooltipPosition(event);
    })
    .on('mousemove', (event) => {
      updateTooltipPosition(event);
    })
    .on('mouseleave', (event) => {
      d3.select(event.currentTarget).style('fill-opacity', 0.7);
      updateTooltipVisibility(false);
    });
  
  // Step 5: Brushing
  const brush = d3.brush()
    .extent([
      [usableArea.left, usableArea.top],
      [usableArea.right, usableArea.bottom]
    ])
    .on('start brush end', (event) => {
      const selection = event.selection;

      const selectedCommits = selection
        ? commits.filter((d) =>
            isCommitSelected(selection, d, xScale, yScale)
          )
        : [];

      dots.selectAll('circle')
        .classed('selected', (d) =>
          isCommitSelected(selection, d, xScale, yScale)
        );

      renderSelectionCount(selectedCommits);
      renderLanguageBreakdown(selectedCommits);
    });

  svg.call(brush);

  // Raise dots above the brush overlay to preserve tooltips
  dots.raise();
}

let data = await loadData();
let commits = processCommits(data);
renderCommitInfo(data, commits);
renderScatterPlot(data, commits);

function renderTooltipContent(commit) {
  const link = document.getElementById('commit-link');
  const date = document.getElementById('commit-date');
  const time = document.getElementById('commit-time');
  const lines = document.getElementById('commit-lines');

  if (!commit || Object.keys(commit).length === 0) return;

  link.href = commit.url;
  link.textContent = commit.id;

  date.textContent = commit.datetime?.toLocaleDateString('en', {
    dateStyle: 'full'
  });

  time.textContent = commit.time;
  lines.textContent = commit.totalLines;
}

function updateTooltipVisibility(isVisible) {
  const tooltip = document.getElementById('commit-tooltip');
  tooltip.hidden = !isVisible;
}

function updateTooltipPosition(event) {
  const tooltip = document.getElementById('commit-tooltip');

  tooltip.style.left = `${event.clientX + 10}px`;
  tooltip.style.top = `${event.clientY + 10}px`;
}

// Step 5.4: Check if a commit falls within the brush rectangle
function isCommitSelected(selection, commit, xScale, yScale) {
  if (!selection) return false;

  const [[x0, y0], [x1, y1]] = selection;

  const x = xScale(commit.datetime);
  const y = yScale(commit.hourFrac);

  return x >= x0 && x <= x1 && y >= y0 && y <= y1;
}

function renderSelectionCount(selectedCommits) {
  const countElement = document.querySelector('#selection-count');

  countElement.textContent =
    `${selectedCommits.length || 'No'} commits selected`;
}

function renderLanguageBreakdown(selectedCommits) {
  const container = d3.select('#language-breakdown');

  container.selectAll('*').remove();

  if (selectedCommits.length === 0) return;

  const lines = selectedCommits.flatMap((d) => d.lines);

  const breakdown = d3.rollup(
    lines,
    (v) => v.length,
    (d) => d.type
  );

  for (const [language, count] of breakdown) {
    const proportion = count / lines.length;
    const formatted = d3.format('.1~%')(proportion);

    const div = container.append('div');

    div.append('dt').text(language);
    div.append('dd').text(`${count} lines (${formatted})`);
  }
}