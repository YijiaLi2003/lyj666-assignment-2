// script.js

let dataPoints = [];
let centroids = [];
let clusters = [];
let currentStep = 0;
let initMethod = 'random';
let k = 3; 
let converged = false;
let plotInitialized = false; 

// Reference to the plot element
const plotElement = document.getElementById('plot');

// Fetch data from server
fetch('/get_data')
    .then(response => response.json())
    .then(data => {
        dataPoints = data.data;
        plotData();
    });

// Event listeners for UI controls
document.getElementById('init-method').addEventListener('change', function() {
    initMethod = this.value;
    reset();
});

document.getElementById('num-clusters').addEventListener('change', function() {
    reset();
});

document.getElementById('new-data').addEventListener('click', function() {
    fetch('/new_data')
        .then(response => response.json())
        .then(data => {
            dataPoints = data.data;
            reset();
        });
});

document.getElementById('reset').addEventListener('click', function() {
    reset();
});

document.getElementById('step').addEventListener('click', function() {
    step();
});

document.getElementById('converge').addEventListener('click', function() {
    while (!converged) {
        step();
    }
});

// Function to plot data points and centroids
function plotData() {
    let traces = [];
    let x = dataPoints.map(p => p[0]);
    let y = dataPoints.map(p => p[1]);
    traces.push({
        x: x,
        y: y,
        mode: 'markers',
        type: 'scatter',
        name: 'Data Points',
        marker: { color: 'black' }
    });

    if (centroids.length > 0) {
        let centroidX = centroids.map(c => c[0]);
        let centroidY = centroids.map(c => c[1]);
        traces.push({
            x: centroidX,
            y: centroidY,
            mode: 'markers',
            type: 'scatter',
            name: 'Centroids',
            marker: { color: 'red', symbol: 'x', size: 12 }
        });
    }
    let layout = {
        title: 'KMeans Clustering',
        xaxis: { title: 'X' },
        yaxis: { title: 'Y' }
    };

    if (plotInitialized) {
        return Plotly.react('plot', traces, layout);
    } else {
        plotInitialized = true;
        return Plotly.newPlot('plot', traces, layout);
    }
}

// Function to reset the algorithm
function reset() {
    k = parseInt(document.getElementById('num-clusters').value);
    centroids = [];
    clusters = [];
    currentStep = 0;
    converged = false;

    document.getElementById('step').disabled = false;
    document.getElementById('converge').disabled = false;

    plotInitialized = false;

    if (initMethod !== 'manual') {
        initializeCentroids();
    }


    plotData();
}

plotElement.addEventListener('click', onPlotClick);

// Event handler function for plot clicks
function onPlotClick(event) {
    if (initMethod !== 'manual') {
        return;
    }
    if (centroids.length >= k) {
        return;
    }


    let boundingRect = plotElement.getBoundingClientRect();

    let xPixels = event.clientX - boundingRect.left;
    let yPixels = event.clientY - boundingRect.top;


    let xaxis = plotElement._fullLayout.xaxis;
    let yaxis = plotElement._fullLayout.yaxis;

    let x0 = xaxis._offset;
    let x1 = xaxis._offset + xaxis._length;

    let y0 = yaxis._offset;
    let y1 = yaxis._offset + yaxis._length;

    let xRange = xaxis.range;
    let yRange = yaxis.range;

    if (xPixels < x0 || xPixels > x1 || yPixels < y0 || yPixels > y1) {
        return;
    }

    let xFrac = (xPixels - x0) / (x1 - x0);
    let yFrac = (yPixels - y0) / (y1 - y0);

    let xData = xRange[0] + xFrac * (xRange[1] - xRange[0]);
    let yData = yRange[1] - yFrac * (yRange[1] - yRange[0]); 

    centroids.push([xData, yData]);

    plotData();
}

// Function to initialize centroids
function initializeCentroids() {
    if (initMethod === 'random') {
        centroids = [];
        let indices = [];
        while (centroids.length < k) {
            let idx = Math.floor(Math.random() * dataPoints.length);
            if (!indices.includes(idx)) {
                indices.push(idx);
                centroids.push(dataPoints[idx]);
            }
        }
    } else if (initMethod === 'farthest') {
        centroids = [];
        let idx = Math.floor(Math.random() * dataPoints.length);
        centroids.push(dataPoints[idx]);
        while (centroids.length < k) {
            let maxDist = -1;
            let farthestPoint = null;
            dataPoints.forEach(p => {
                let minDistToCentroid = Math.min(...centroids.map(c => distance(p, c)));
                if (minDistToCentroid > maxDist) {
                    maxDist = minDistToCentroid;
                    farthestPoint = p;
                }
            });
            centroids.push(farthestPoint);
        }
    } else if (initMethod === 'kmeans++') {
        centroids = [];
        let idx = Math.floor(Math.random() * dataPoints.length);
        centroids.push(dataPoints[idx]);
        while (centroids.length < k) {
            let distances = dataPoints.map(p => {
                let minDistToCentroid = Math.min(...centroids.map(c => distance(p, c)));
                return minDistToCentroid * minDistToCentroid;
            });
            let sum = distances.reduce((a, b) => a + b);
            let r = Math.random() * sum;
            let cumulative = 0;
            for (let i = 0; i < distances.length; i++) {
                cumulative += distances[i];
                if (cumulative >= r) {
                    centroids.push(dataPoints[i]);
                    break;
                }
            }
        }
    }
}

// Function to perform one step of the KMeans algorithm
function step() {
    if (converged) {
        alert('The algorithm has already converged.');
        return;
    }
    if (centroids.length < k) {
        alert('Please select initial centroids');
        return;
    }
    clusters = [];
    for (let i = 0; i < k; i++) {
        clusters.push([]);
    }
    dataPoints.forEach(p => {
        let distances = centroids.map(c => distance(p, c));
        let minIndex = distances.indexOf(Math.min(...distances));
        clusters[minIndex].push(p);
    });
    let newCentroids = [];
    for (let i = 0; i < k; i++) {
        if (clusters[i].length === 0) {
            newCentroids.push(centroids[i]);  
        } else {
            let meanX = clusters[i].reduce((sum, p) => sum + p[0], 0) / clusters[i].length;
            let meanY = clusters[i].reduce((sum, p) => sum + p[1], 0) / clusters[i].length;
            newCentroids.push([meanX, meanY]);
        }
    }
    converged = centroids.every((c, i) => c[0] === newCentroids[i][0] && c[1] === newCentroids[i][1]);
    centroids = newCentroids;
    plotClusters();
}

//Function to plot
function plotClusters() {
    let traces = [];
    let colors = ['red', 'green', 'blue', 'orange', 'purple', 'brown', 'pink', 'gray'];
    for (let i = 0; i < k; i++) {
        let cluster = clusters[i];
        if (cluster.length > 0) {
            let x = cluster.map(p => p[0]);
            let y = cluster.map(p => p[1]);
            traces.push({
                x: x,
                y: y,
                mode: 'markers',
                type: 'scatter',
                name: 'Cluster ' + (i + 1),
                marker: { color: colors[i % colors.length] }
            });
        }
        traces.push({
            x: [centroids[i][0]],
            y: [centroids[i][1]],
            mode: 'markers',
            type: 'scatter',
            name: 'Centroid ' + (i + 1),
            marker: { color: colors[i % colors.length], symbol: 'x', size: 12 }
        });
    }
    let layout = {
        title: 'KMeans Clustering - Step ' + currentStep,
        xaxis: { title: 'X' },
        yaxis: { title: 'Y' }
    };
    if (converged) {
        layout.title = 'KMeans Clustering - Converged in ' + currentStep + ' Steps';
        document.getElementById('step').disabled = true;
        document.getElementById('converge').disabled = true;
    }
    Plotly.react('plot', traces, layout);
    if (!converged) {
        currentStep++;
    }
}

// Euclidean distance
function distance(p1, p2) {
    let dx = p1[0] - p2[0];
    let dy = p1[1] - p2[1];
    return Math.sqrt(dx * dx + dy * dy);
}
