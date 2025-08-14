# Stationary & Gift Shop Dashboard

A web-based dashboard for analyzing proposal budgets and calculating sales projections for stationary and gift shop businesses.

## Features

### 📊 Budget Analysis
- **Excel File Integration**: Load your existing Excel proposal file
- **Automatic Data Parsing**: Extracts stationary and gift budget information
- **Visual Budget Cards**: Clear display of budget allocations
- **Detailed Breakdown**: Itemized view of all budget components

### 📈 Sales Projection Calculator
- **Interactive Input**: Enter sales amounts and see instant projections
- **Customizable Parameters**: Adjust profit margins and growth rates
- **ROI Timeline**: Calculate how long to recover initial investment
- **Visual Charts**: 12-month projection graphs with revenue and profit trends

### 💡 Key Capabilities
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Real-time Calculations**: Instant updates when parameters change
- **Professional Styling**: Clean, modern interface
- **Data Visualization**: Interactive charts and graphs

## How to Use

### 1. Load Your Excel File
1. Open `index.html` in your web browser
2. Click the "📁 Load Excel File" button
3. Select your Excel file containing proposal budget data
4. The dashboard will automatically parse and display the data

### 2. View Budget Information
- **Stationary Budget**: Shows total budget and item count for stationary items
- **Gift Budget**: Shows total budget and item count for gift items  
- **Total Budget**: Combined budget across both categories
- **Detailed Breakdown**: Scroll down to see itemized budget table

### 3. Calculate Sales Projections
1. Enter a sales amount in the "Sales Amount" field
2. Adjust the profit margin percentage (default: 25%)
3. Set the monthly growth rate percentage (default: 5%)
4. Click "Calculate Projection" to see results

### 4. Analyze Results
- **Monthly Revenue**: Expected monthly sales
- **Monthly Profit**: Profit after expenses
- **Annual Projection**: 12-month revenue forecast with growth
- **ROI Timeline**: Months needed to recover initial investment
- **Projection Chart**: Visual representation of 12-month trends

## Excel File Format

The dashboard can automatically detect budget information from Excel files. For best results, ensure your Excel file contains:

- **Item names** in text columns
- **Amounts** in numeric columns
- **Keywords** like "stationary", "stationery", "gift", "pen", "paper", etc.

### Example Excel Structure:
```
Item Name          | Category    | Amount
Pens & Pencils     | Stationary  | 2000
Notebooks          | Stationary  | 3000
Gift Cards         | Gift        | 1500
Decorations        | Gift        | 2500
```

## Technical Details

### Technologies Used
- **HTML5**: Structure and layout
- **CSS3**: Styling and responsive design
- **JavaScript**: Interactive functionality
- **SheetJS**: Excel file reading
- **Chart.js**: Data visualization

### Browser Compatibility
- Chrome (recommended)
- Firefox
- Safari
- Edge

### File Structure
```
├── index.html          # Main dashboard page
├── styles.css          # Styling and layout
├── dashboard.js        # JavaScript functionality
└── README.md          # This documentation
```

## Customization

### Modifying Default Values
Edit `dashboard.js` to change:
- Default profit margin (line with `value="25"`)
- Default growth rate (line with `value="5"`)
- Sample budget data (in `findTotalAmounts` function)

### Styling Changes
Edit `styles.css` to customize:
- Color schemes
- Layout dimensions
- Font styles
- Responsive breakpoints

## Troubleshooting

### Excel File Not Loading
- Ensure file is in .xlsx or .xls format
- Check that file is not password protected
- Verify file is not corrupted

### Budget Data Not Showing
- Check that Excel contains recognizable keywords
- Ensure amounts are in numeric format
- Try using the sample data feature

### Calculations Not Working
- Verify sales amount is a positive number
- Check that profit margin is between 0-100%
- Ensure growth rate is a reasonable percentage

## Support

For issues or questions:
1. Check the browser console for error messages
2. Verify Excel file format and content
3. Test with a simple Excel file first
4. Ensure all required files are in the same directory

## Future Enhancements

Potential improvements:
- Multiple file format support (CSV, JSON)
- Advanced filtering and sorting
- Export functionality for projections
- Historical data comparison
- Multi-currency support
