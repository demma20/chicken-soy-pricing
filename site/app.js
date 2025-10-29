let allData = [];
let priceChart = null;
let currentCommodity = 'chicken';

// Country colors - consistent across both charts
const COUNTRY_COLORS = {
    'United States': 'rgb(59, 130, 246)',      // blue
    'European Union': 'rgb(16, 185, 129)',     // green
    'EU': 'rgb(16, 185, 129)',                 // green (same as European Union)
    'Thailand': 'rgb(168, 85, 247)'            // purple
};

// Load data on page load
async function loadData() {
    try {
        const response = await fetch('latest.json');
        allData = await response.json();
        console.log('Loaded', allData.length, 'records');
        updateChart();
    } catch (error) {
        console.error('Error loading data:', error);
    }
}

// Update chart based on selected commodity
function updateChart() {
    const filtered = allData.filter(d => d.commodity === currentCommodity);
    console.log(`Filtered to ${filtered.length} ${currentCommodity} records`);
    
    // Group by country and product form
    const grouped = {};
    
    filtered.forEach(record => {
        // Skip records without price data
        if (!record.usd_per_kg || !record.date) return;
        
        const country = record.country;
        const productForm = record.product_form || 'unknown';
        const key = `${country}|${productForm}`;
        
        if (!grouped[key]) {
            grouped[key] = {
                country: country,
                productForm: productForm,
                data: []
            };
        }
        
        grouped[key].data.push({
            x: new Date(record.date),
            y: record.usd_per_kg,
            inr: record.inr_per_kg
        });
    });
    
    // Sort each series by date
    Object.values(grouped).forEach(series => {
        series.data.sort((a, b) => a.x - b.x);
    });
    
    // Create datasets
    const datasets = Object.values(grouped).map(series => {
        const isThigh = series.productForm.toLowerCase().includes('thigh');
        
        return {
            label: `${series.country} • ${series.productForm}`,
            data: series.data,
            borderColor: COUNTRY_COLORS[series.country] || 'rgb(107, 114, 128)',
            backgroundColor: 'transparent',
            borderWidth: 2.5,
            borderDash: isThigh ? [5, 5] : [],  // Dotted for thighs, solid for others
            pointRadius: 0,
            pointHoverRadius: 5,
            tension: 0.1
        };
    });
    
    console.log('Created', datasets.length, 'datasets');
    
    // Destroy existing chart
    if (priceChart) {
        priceChart.destroy();
    }
    
    // Create new chart
    const ctx = document.getElementById('priceChart');
    priceChart = new Chart(ctx, {
        type: 'line',
        data: { datasets },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'nearest',
                intersect: false,
                axis: 'x'
            },
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: 'month',
                        displayFormats: {
                            month: 'MMM yyyy'
                        }
                    },
                    grid: {
                        display: false
                    },
                    ticks: {
                        font: {
                            size: 12
                        }
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Price (USD/kg)',
                        font: {
                            size: 14,
                            weight: 'bold'
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    },
                    ticks: {
                        callback: function(value) {
                            return '$' + value.toFixed(2);
                        },
                        font: {
                            size: 12
                        }
                    }
                },
                yInr: {
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Price (INR/kg)',
                        font: {
                            size: 14,
                            weight: 'bold'
                        }
                    },
                    grid: {
                        display: false
                    },
                    ticks: {
                        callback: function(value) {
                            // Convert USD to INR (approximate based on your data)
                            const inrValue = value * 87.82;
                            return '₹' + inrValue.toFixed(0);
                        },
                        font: {
                            size: 12
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom',
                    labels: {
                        usePointStyle: true,
                        padding: 15,
                        font: {
                            size: 12
                        }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    titleFont: {
                        size: 14
                    },
                    bodyFont: {
                        size: 13
                    },
                    callbacks: {
                        title: function(items) {
                            const date = new Date(items[0].parsed.x);
                            return date.toLocaleDateString('en-US', { 
                                month: 'short', 
                                year: 'numeric' 
                            });
                        },
                        label: function(context) {
                            const dataPoint = context.raw;
                            const usd = dataPoint.y.toFixed(2);
                            const inr = dataPoint.inr ? dataPoint.inr.toFixed(2) : 'N/A';
                            return [
                                context.dataset.label,
                                `USD: $${usd}/kg`,
                                `INR: ₹${inr}/kg`
                            ];
                        }
                    }
                }
            }
        }
    });
}

// Commodity button handlers
document.querySelectorAll('.commodity-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        // Update active state
        document.querySelectorAll('.commodity-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        
        // Update chart
        currentCommodity = this.dataset.commodity;
        updateChart();
    });
});

// Initialize
loadData();
