// Global variables
let excelData = null;
let budgetData = {
    stationary: { total: 0, items: [] },
    gift: { total: 0, items: [] }
};
let projectionChart = null;

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    initializeDefaultValues();
});

function setupEventListeners() {
    const fileInput = document.getElementById('excelFile');
    fileInput.addEventListener('change', handleFileUpload);
    
    const salesAmountInput = document.getElementById('salesAmount');
    salesAmountInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            calculateProjection();
        }
    });
    
    // Add real-time calculation
    const inputs = ['salesAmount', 'profitMargin', 'growthRate', 'operatingCosts', 'taxRate', 'marketShare', 'seasonalFactor'];
    inputs.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('input', debounce(calculateProjection, 500));
        }
    });
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function initializeDefaultValues() {
    // Set default values for projection inputs
    document.getElementById('profitMargin').value = 25;
    document.getElementById('growthRate').value = 5;
    document.getElementById('operatingCosts').value = 15;
    document.getElementById('taxRate').value = 10;
    document.getElementById('marketShare').value = 2;
    document.getElementById('seasonalFactor').value = 15;
}

function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const fileInfo = document.getElementById('fileInfo');
    fileInfo.innerHTML = '<div class="loading"><div class="loading-spinner"></div>Processing file...</div>';
    
    const reader = new FileReader();
    
    if (file.name.toLowerCase().endsWith('.csv')) {
        reader.onload = function(e) {
            try {
                const csvData = e.target.result;
                processCSVData(csvData);
                fileInfo.textContent = `✅ Successfully loaded: ${file.name}`;
                document.getElementById('dashboardContent').style.display = 'block';
            } catch (error) {
                console.error('Error reading CSV file:', error);
                fileInfo.textContent = '❌ Error loading CSV file. Please check the format.';
            }
        };
        reader.readAsText(file);
    } else {
        reader.onload = function(e) {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                processExcelData(workbook);
                fileInfo.textContent = `✅ Successfully loaded: ${file.name}`;
                document.getElementById('dashboardContent').style.display = 'block';
            } catch (error) {
                console.error('Error reading Excel file:', error);
                fileInfo.textContent = '❌ Error loading Excel file. Please check the format.';
            }
        };
        reader.readAsArrayBuffer(file);
    }
}

function processCSVData(csvText) {
    const lines = csvText.split('\n');
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim()) {
            const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
            const row = {};
            headers.forEach((header, index) => {
                row[header] = values[index] || '';
            });
            data.push(row);
        }
    }
    
    excelData = data;
    analyzeBudgetData(data);
}

function processExcelData(workbook) {
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);
    
    excelData = data;
    analyzeBudgetData(data);
}

function analyzeBudgetData(data) {
    // Reset budget data
    budgetData = {
        stationary: { total: 0, items: [] },
        gift: { total: 0, items: [] }
    };
    
    // Common column names that might contain category information
    const categoryColumns = ['Category', 'category', 'Type', 'type', 'Item Type', 'item_type'];
    const descriptionColumns = ['Description', 'description', 'Item', 'item', 'Name', 'name', 'Product'];
    const amountColumns = ['Amount', 'amount', 'Cost', 'cost', 'Price', 'price', 'Value', 'value', 'Budget'];
    
    // Find the actual column names in the data
    const firstRow = data[0] || {};
    const availableColumns = Object.keys(firstRow);
    
    const categoryColumn = categoryColumns.find(col => availableColumns.includes(col)) || availableColumns[0];
    const descriptionColumn = descriptionColumns.find(col => availableColumns.includes(col)) || availableColumns[1];
    const amountColumn = amountColumns.find(col => availableColumns.includes(col)) || availableColumns.find(col => 
        firstRow[col] && !isNaN(parseFloat(firstRow[col].toString().replace(/[₹,]/g, '')))
    );
    
    data.forEach(row => {
        const category = row[categoryColumn]?.toString().toLowerCase() || '';
        const description = row[descriptionColumn]?.toString() || 'Unknown Item';
        const amountStr = row[amountColumn]?.toString() || '0';
        const amount = parseFloat(amountStr.replace(/[₹,]/g, '')) || 0;
        
        if (amount > 0) {
            const item = {
                description: description,
                amount: amount,
                category: category
            };
            
            // Categorize items
            if (category.includes('stationary') || category.includes('stationery') || 
                category.includes('pen') || category.includes('paper') || 
                category.includes('book') || category.includes('office')) {
                budgetData.stationary.items.push(item);
                budgetData.stationary.total += amount;
            } else if (category.includes('gift') || category.includes('present') || 
                       category.includes('decoration') || category.includes('toy')) {
                budgetData.gift.items.push(item);
                budgetData.gift.total += amount;
            } else {
                // If category is unclear, try to categorize by description
                const desc = description.toLowerCase();
                if (desc.includes('pen') || desc.includes('pencil') || desc.includes('paper') || 
                    desc.includes('notebook') || desc.includes('folder') || desc.includes('stapler')) {
                    budgetData.stationary.items.push(item);
                    budgetData.stationary.total += amount;
                } else {
                    budgetData.gift.items.push(item);
                    budgetData.gift.total += amount;
                }
            }
        }
    });
    
    updateBudgetDisplay();
    updateBudgetBreakdown();
    updateBusinessInsights();
}

function updateBudgetDisplay() {
    const totalBudget = budgetData.stationary.total + budgetData.gift.total;
    const totalItems = budgetData.stationary.items.length + budgetData.gift.items.length;
    
    // Update budget cards
    document.getElementById('stationaryBudget').textContent = `₹${numberWithCommas(budgetData.stationary.total)}`;
    document.getElementById('stationaryDetails').textContent = `${budgetData.stationary.items.length} items`;
    document.getElementById('stationaryPercentage').textContent = 
        `${totalBudget > 0 ? Math.round((budgetData.stationary.total / totalBudget) * 100) : 0}%`;
    
    document.getElementById('giftBudget').textContent = `₹${numberWithCommas(budgetData.gift.total)}`;
    document.getElementById('giftDetails').textContent = `${budgetData.gift.items.length} items`;
    document.getElementById('giftPercentage').textContent = 
        `${totalBudget > 0 ? Math.round((budgetData.gift.total / totalBudget) * 100) : 0}%`;
    
    document.getElementById('totalBudget').textContent = `₹${numberWithCommas(totalBudget)}`;
    document.getElementById('totalDetails').textContent = `${totalItems} total items`;
    
    // Update key metrics
    const avgItemCost = totalItems > 0 ? totalBudget / totalItems : 0;
    document.getElementById('avgItemCost').textContent = `₹${numberWithCommas(Math.round(avgItemCost))}`;
    
    const stationaryRatio = budgetData.stationary.items.length;
    const giftRatio = budgetData.gift.items.length;
    document.getElementById('investmentRatio').textContent = `${stationaryRatio}:${giftRatio}`;
    
    document.getElementById('totalItems').textContent = totalItems;
    
    // Calculate profitability score (simple algorithm based on item diversity and budget distribution)
    const diversityScore = Math.min(100, (totalItems / 20) * 100);
    const balanceScore = totalBudget > 0 ? 
        (100 - Math.abs(50 - (budgetData.stationary.total / totalBudget * 100))) * 2 : 0;
    const profitabilityScore = Math.round((diversityScore + balanceScore) / 2);
    document.getElementById('profitabilityScore').textContent = profitabilityScore;
}

function updateBudgetBreakdown() {
    const tbody = document.querySelector('#budgetBreakdown tbody');
    tbody.innerHTML = '';
    
    const totalBudget = budgetData.stationary.total + budgetData.gift.total;
    const allItems = [
        ...budgetData.stationary.items.map(item => ({ ...item, category: 'Stationary' })),
        ...budgetData.gift.items.map(item => ({ ...item, category: 'Gift' }))
    ];
    
    // Sort items by amount (descending)
    allItems.sort((a, b) => b.amount - a.amount);
    
    allItems.forEach(item => {
        const row = tbody.insertRow();
        const percentage = totalBudget > 0 ? ((item.amount / totalBudget) * 100).toFixed(1) : 0;
        const priority = item.amount > (totalBudget * 0.1) ? 'High' : 
                        item.amount > (totalBudget * 0.05) ? 'Medium' : 'Low';
        
        row.innerHTML = `
            <td><span class="category-badge ${item.category.toLowerCase()}">${item.category}</span></td>
            <td>${item.description}</td>
            <td>₹${numberWithCommas(item.amount)}</td>
            <td>${percentage}%</td>
            <td><span class="priority-badge priority-${priority.toLowerCase()}">${priority}</span></td>
        `;
    });
}

function updateBusinessInsights() {
    const totalBudget = budgetData.stationary.total + budgetData.gift.total;
    const stationaryPercentage = totalBudget > 0 ? (budgetData.stationary.total / totalBudget * 100) : 0;
    
    // Investment Distribution Insight
    let distributionInsight = '';
    if (stationaryPercentage > 70) {
        distributionInsight = 'Heavy focus on stationary items (70%+). Consider diversifying with more gift items to capture broader market.';
    } else if (stationaryPercentage < 30) {
        distributionInsight = 'Gift-heavy portfolio. Stationary items offer steady demand - consider increasing this segment.';
    } else {
        distributionInsight = 'Well-balanced investment between stationary and gift items. Good diversification strategy.';
    }
    document.getElementById('investmentInsight').textContent = distributionInsight;
    
    // Market Opportunity Insight
    const totalItems = budgetData.stationary.items.length + budgetData.gift.items.length;
    const avgItemCost = totalItems > 0 ? totalBudget / totalItems : 0;
    let marketInsight = '';
    if (avgItemCost > 500) {
        marketInsight = 'Premium product focus. Target affluent customers with quality positioning.';
    } else if (avgItemCost < 100) {
        marketInsight = 'Budget-friendly approach. Great for volume sales and student markets.';
    } else {
        marketInsight = 'Mid-range pricing strategy. Appeals to broad customer base with value proposition.';
    }
    document.getElementById('marketInsight').textContent = marketInsight;
    
    // Growth Potential Insight
    let growthInsight = '';
    if (totalItems > 50) {
        growthInsight = 'Extensive product range provides multiple revenue streams and growth opportunities.';
    } else if (totalItems > 20) {
        growthInsight = 'Moderate product range. Room for expansion in both categories for increased market share.';
    } else {
        growthInsight = 'Focused product selection. Consider expanding range to maximize growth potential.';
    }
    document.getElementById('growthInsight').textContent = growthInsight;
}

function loadScenario(scenario) {
    const scenarios = {
        conservative: {
            salesAmount: Math.max(20000, budgetData.stationary.total + budgetData.gift.total),
            profitMargin: 20,
            growthRate: 3,
            operatingCosts: 20,
            taxRate: 12,
            marketShare: 1,
            seasonalFactor: 10
        },
        moderate: {
            salesAmount: Math.max(35000, (budgetData.stationary.total + budgetData.gift.total) * 1.5),
            profitMargin: 25,
            growthRate: 5,
            operatingCosts: 15,
            taxRate: 10,
            marketShare: 2,
            seasonalFactor: 15
        },
        optimistic: {
            salesAmount: Math.max(50000, (budgetData.stationary.total + budgetData.gift.total) * 2),
            profitMargin: 30,
            growthRate: 8,
            operatingCosts: 12,
            taxRate: 8,
            marketShare: 3,
            seasonalFactor: 20
        }
    };
    
    const selectedScenario = scenarios[scenario];
    Object.keys(selectedScenario).forEach(key => {
        const element = document.getElementById(key);
        if (element) {
            element.value = selectedScenario[key];
        }
    });
    
    calculateProjection();
}

function calculateProjection() {
    const salesAmount = parseFloat(document.getElementById('salesAmount').value) || 0;
    const profitMargin = parseFloat(document.getElementById('profitMargin').value) || 25;
    const growthRate = parseFloat(document.getElementById('growthRate').value) || 5;
    const operatingCosts = parseFloat(document.getElementById('operatingCosts').value) || 15;
    const taxRate = parseFloat(document.getElementById('taxRate').value) || 10;
    const marketShare = parseFloat(document.getElementById('marketShare').value) || 2;
    const seasonalFactor = parseFloat(document.getElementById('seasonalFactor').value) || 15;
    
    if (salesAmount <= 0) {
        clearResults();
        return;
    }
    
    // Calculate monthly metrics
    const monthlyRevenue = salesAmount;
    const grossProfit = monthlyRevenue * (profitMargin / 100);
    const operatingExpenses = monthlyRevenue * (operatingCosts / 100);
    const taxAmount = (grossProfit - operatingExpenses) * (taxRate / 100);
    const monthlyProfit = grossProfit - operatingExpenses - taxAmount;
    
    // Calculate annual projection with growth
    let annualRevenue = 0;
    let annualProfit = 0;
    const monthlyData = [];
    
    for (let month = 1; month <= 12; month++) {
        const growthFactor = Math.pow(1 + growthRate / 100, (month - 1) / 12);
        const seasonalMultiplier = 1 + (Math.sin((month - 1) * Math.PI / 6) * seasonalFactor / 100);
        
        const monthRevenue = monthlyRevenue * growthFactor * seasonalMultiplier;
        const monthGrossProfit = monthRevenue * (profitMargin / 100);
        const monthOperatingExpenses = monthRevenue * (operatingCosts / 100);
        const monthTaxAmount = (monthGrossProfit - monthOperatingExpenses) * (taxRate / 100);
        const monthNetProfit = monthGrossProfit - monthOperatingExpenses - monthTaxAmount;
        
        annualRevenue += monthRevenue;
        annualProfit += monthNetProfit;
        
        monthlyData.push({
            month: month,
            revenue: monthRevenue,
            profit: monthNetProfit,
            expenses: monthOperatingExpenses + monthTaxAmount
        });
    }
    
    // Calculate ROI and break-even
    const totalInvestment = budgetData.stationary.total + budgetData.gift.total;
    const monthsToBreakeven = totalInvestment > 0 ? Math.ceil(totalInvestment / monthlyProfit) : 0;
    const roiPercentage = totalInvestment > 0 ? ((annualProfit / totalInvestment) * 100) : 0;
    const cashFlow = monthlyProfit;
    
    // Update results display
    updateResults({
        monthlyRevenue,
        monthlyProfit,
        annualRevenue,
        monthsToBreakeven,
        roiPercentage,
        cashFlow,
        monthlyData
    });
    
    updatePerformanceIndicators({
        profitMargin,
        marketShare,
        growthRate,
        operatingCosts
    });
    
    updateSummary({
        totalInvestment,
        monthsToBreakeven,
        roiPercentage,
        annualRevenue
    });
}

function updateResults(results) {
    document.getElementById('monthlyRevenue').textContent = `₹${numberWithCommas(Math.round(results.monthlyRevenue))}`;
    document.getElementById('monthlyProfit').textContent = `₹${numberWithCommas(Math.round(results.monthlyProfit))}`;
    document.getElementById('annualProjection').textContent = `₹${numberWithCommas(Math.round(results.annualRevenue))}`;
    document.getElementById('roiTimeline').textContent = `${results.monthsToBreakeven} months`;
    document.getElementById('roiPercentage').textContent = `${Math.round(results.roiPercentage)}%`;
    document.getElementById('cashFlow').textContent = `₹${numberWithCommas(Math.round(results.cashFlow))}`;
    
    // Update chart
    updateProjectionChart(results.monthlyData);
}

function updateProjectionChart(monthlyData) {
    const ctx = document.getElementById('projectionChart').getContext('2d');
    
    if (projectionChart) {
        projectionChart.destroy();
    }
    
    const labels = monthlyData.map(data => `Month ${data.month}`);
    const revenueData = monthlyData.map(data => Math.round(data.revenue));
    const profitData = monthlyData.map(data => Math.round(data.profit));
    const expenseData = monthlyData.map(data => Math.round(data.expenses));
    
    projectionChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Revenue',
                    data: revenueData,
                    borderColor: '#27ae60',
                    backgroundColor: 'rgba(39, 174, 96, 0.1)',
                    tension: 0.4,
                    fill: false
                },
                {
                    label: 'Profit',
                    data: profitData,
                    borderColor: '#2ecc71',
                    backgroundColor: 'rgba(46, 204, 113, 0.1)',
                    tension: 0.4,
                    fill: false
                },
                {
                    label: 'Expenses',
                    data: expenseData,
                    borderColor: '#e74c3c',
                    backgroundColor: 'rgba(231, 76, 60, 0.1)',
                    tension: 0.4,
                    fill: false
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ₹' + numberWithCommas(context.parsed.y);
                        }
                    }
                }
            },
            scales: {
                x: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Timeline'
                    }
                },
                y: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Amount (₹)'
                    },
                    ticks: {
                        callback: function(value) {
                            return '₹' + numberWithCommas(value);
                        }
                    }
                }
            },
            interaction: {
                mode: 'nearest',
                axis: 'x',
                intersect: false
            }
        }
    });
}

function updatePerformanceIndicators(params) {
    // Profit Margin Efficiency (0-100%)
    const profitEfficiency = Math.min(100, Math.max(0, params.profitMargin * 2));
    document.getElementById('profitEfficiency').style.width = `${profitEfficiency}%`;
    document.getElementById('profitEfficiencyValue').textContent = `${Math.round(profitEfficiency)}%`;
    
    // Market Penetration (0-100%)
    const marketPenetration = Math.min(100, params.marketShare * 20);
    document.getElementById('marketPenetration').style.width = `${marketPenetration}%`;
    document.getElementById('marketPenetrationValue').textContent = `${Math.round(marketPenetration)}%`;
    
    // Growth Sustainability (0-100%)
    const growthSustainability = Math.min(100, Math.max(0, 100 - params.operatingCosts * 2 + params.growthRate * 5));
    document.getElementById('growthSustainability').style.width = `${growthSustainability}%`;
    document.getElementById('growthSustainabilityValue').textContent = `${Math.round(growthSustainability)}%`;
}

function updateSummary(summary) {
    document.getElementById('summaryInvestment').textContent = `₹${numberWithCommas(summary.totalInvestment)}`;
    document.getElementById('summaryBreakeven').textContent = summary.monthsToBreakeven;
    document.getElementById('summaryROI').textContent = `${Math.round(summary.roiPercentage)}%`;
    document.getElementById('summaryRevenue').textContent = `₹${numberWithCommas(Math.round(summary.annualRevenue))}`;
}

function clearResults() {
    const resultElements = [
        'monthlyRevenue', 'monthlyProfit', 'annualProjection', 
        'roiTimeline', 'roiPercentage', 'cashFlow'
    ];
    
    resultElements.forEach(id => {
        document.getElementById(id).textContent = '₹0';
    });
    
    document.getElementById('roiTimeline').textContent = '0 months';
    document.getElementById('roiPercentage').textContent = '0%';
    
    if (projectionChart) {
        projectionChart.destroy();
        projectionChart = null;
    }
}

function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Export functions for global access
window.calculateProjection = calculateProjection;
window.loadScenario = loadScenario;