// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  Timestamp
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC5n40vPlIjXQ25X4NJlr8Z2jRGux0C1Y8",
  authDomain: "grindon-da126.firebaseapp.com", 
  projectId: "grindon-da126",
  storageBucket: "grindon-da126.firebasestorage.app",
  messagingSenderId: "606558901364",
  appId: "1:606558901364:web:e39156bea8d403f191ed21"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Main analytics class
class AdminAnalytics {
  constructor() {
    this.salesData = {
      daily: [],
      weekly: [],
      monthly: []
    };
    this.currentView = 'daily'; // Default view
    this.chartInstance = null;
  }

  // Initialize analytics
  async init() {
    try {
      // Fetch sales data
      await this.fetchSalesData();
      
      // Initialize charts
      this.initCharts();
      
      // Setup event listeners
      this.setupEventListeners();
      
      // Update summary cards with latest data
      this.updateSummaryCards();
      
      console.log('Analytics initialized successfully');
    } catch (error) {
      console.error('Error initializing analytics:', error);
    }
  }
  
  // Fetch sales data from Firestore
  async fetchSalesData() {
    try {
      const ordersRef = collection(db, "orders");
      
      // Only get shipped orders (these count as completed sales)
      const shippedOrdersQuery = query(ordersRef, where("status", "==", "Shipped"));
      const querySnapshot = await getDocs(shippedOrdersQuery);
      
      // Process orders
      const orders = [];
      querySnapshot.forEach((doc) => {
        const orderData = doc.data();
        
        // Skip if no timestamp (for older orders that might not have it)
        if (!orderData.timestamp && !orderData.createdAt) {
          return;
        }
        
        // Use either timestamp or createdAt field
        const timestamp = orderData.timestamp || orderData.createdAt;
        const date = timestamp instanceof Timestamp ? 
          timestamp.toDate() : 
          (timestamp.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp));
        
        orders.push({
          id: doc.id,
          date: date,
          total: parseFloat(orderData.total) || 0,
          items: orderData.items || []
        });
      });
      
      // Sort orders by date
      orders.sort((a, b) => a.date - b.date);
      
      // Process data for different time periods
      this.processDailyData(orders);
      this.processWeeklyData(orders);
      this.processMonthlyData(orders);
      
      console.log('Sales data fetched successfully');
    } catch (error) {
      console.error('Error fetching sales data:', error);
      throw error;
    }
  }
  
  // Process daily sales data
  processDailyData(orders) {
    // Get the last 7 days
    const dailyData = {};
    const now = new Date();
    
    // Initialize last 7 days with zero values
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(now.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      dailyData[dateStr] = {
        sales: 0,
        count: 0,
        items: {}
      };
    }
    
    // Process orders for the last 7 days
    orders.forEach(order => {
      const dateStr = order.date.toISOString().split('T')[0];
      const dayDiff = Math.floor((now - order.date) / (1000 * 60 * 60 * 24));
      
      // Only include orders from the last 7 days
      if (dayDiff <= 6 && dayDiff >= 0) {
        // Initialize if this date doesn't exist
        if (!dailyData[dateStr]) {
          dailyData[dateStr] = {
            sales: 0,
            count: 0,
            items: {}
          };
        }
        
        // Add sales data
        dailyData[dateStr].sales += order.total;
        dailyData[dateStr].count += 1;
        
        // Track item counts
        order.items.forEach(item => {
          const itemName = item.name;
          const quantity = item.quantity || 1;
          
          if (!dailyData[dateStr].items[itemName]) {
            dailyData[dateStr].items[itemName] = 0;
          }
          
          dailyData[dateStr].items[itemName] += quantity;
        });
      }
    });
    
    // Convert to array format for Chart.js
    this.salesData.daily = Object.entries(dailyData).map(([date, data]) => {
      return {
        date: this.formatDate(date, 'daily'),
        sales: data.sales,
        count: data.count,
        items: data.items
      };
    });
  }
  
  // Process weekly sales data
  processWeeklyData(orders) {
    // Get the last 6 weeks
    const weeklyData = {};
    const now = new Date();
    
    // Initialize last 6 weeks with zero values
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(now.getDate() - (i * 7));
      const weekStart = this.getWeekStart(date);
      const weekKey = weekStart.toISOString().split('T')[0];
      
      weeklyData[weekKey] = {
        sales: 0,
        count: 0,
        items: {}
      };
    }
    
    // Process orders for the last 6 weeks
    orders.forEach(order => {
      const weekStart = this.getWeekStart(order.date);
      const weekKey = weekStart.toISOString().split('T')[0];
      const weekDiff = Math.floor((now - weekStart) / (1000 * 60 * 60 * 24 * 7));
      
      // Only include orders from the last 6 weeks
      if (weekDiff <= 5 && weekDiff >= 0) {
        // Initialize if this week doesn't exist
        if (!weeklyData[weekKey]) {
          weeklyData[weekKey] = {
            sales: 0,
            count: 0,
            items: {}
          };
        }
        
        // Add sales data
        weeklyData[weekKey].sales += order.total;
        weeklyData[weekKey].count += 1;
        
        // Track item counts
        order.items.forEach(item => {
          const itemName = item.name;
          const quantity = item.quantity || 1;
          
          if (!weeklyData[weekKey].items[itemName]) {
            weeklyData[weekKey].items[itemName] = 0;
          }
          
          weeklyData[weekKey].items[itemName] += quantity;
        });
      }
    });
    
    // Convert to array format for Chart.js
    this.salesData.weekly = Object.entries(weeklyData).map(([date, data]) => {
      return {
        date: this.formatDate(date, 'weekly'),
        sales: data.sales,
        count: data.count,
        items: data.items
      };
    });
  }
  
  // Process monthly sales data
  processMonthlyData(orders) {
    // Get the last 6 months
    const monthlyData = {};
    const now = new Date();
    
    // Initialize last 6 months with zero values
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now);
      date.setMonth(now.getMonth() - i);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      monthlyData[monthKey] = {
        sales: 0,
        count: 0,
        items: {}
      };
    }
    
    // Process orders for the last 6 months
    orders.forEach(order => {
      const monthKey = `${order.date.getFullYear()}-${String(order.date.getMonth() + 1).padStart(2, '0')}`;
      const yearDiff = now.getFullYear() - order.date.getFullYear();
      const monthDiff = now.getMonth() - order.date.getMonth() + (yearDiff * 12);
      
      // Only include orders from the last 6 months
      if (monthDiff <= 5 && monthDiff >= 0) {
        // Initialize if this month doesn't exist
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = {
            sales: 0,
            count: 0,
            items: {}
          };
        }
        
        // Add sales data
        monthlyData[monthKey].sales += order.total;
        monthlyData[monthKey].count += 1;
        
        // Track item counts
        order.items.forEach(item => {
          const itemName = item.name;
          const quantity = item.quantity || 1;
          
          if (!monthlyData[monthKey].items[itemName]) {
            monthlyData[monthKey].items[itemName] = 0;
          }
          
          monthlyData[monthKey].items[itemName] += quantity;
        });
      }
    });
    
    // Convert to array format for Chart.js
    this.salesData.monthly = Object.entries(monthlyData).map(([date, data]) => {
      return {
        date: this.formatDate(date, 'monthly'),
        sales: data.sales,
        count: data.count,
        items: data.items
      };
    });
  }
  
  // Format date based on view type
  formatDate(dateStr, viewType) {
    const date = new Date(dateStr);
    
    switch (viewType) {
      case 'daily':
        // Format: "Apr 29"
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      case 'weekly':
        // Format: "Apr 22-28"
        const weekEnd = new Date(date);
        weekEnd.setDate(date.getDate() + 6);
        return `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}-${weekEnd.getDate()}`;
      case 'monthly':
        // Format: "Apr 2025"
        return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      default:
        return dateStr;
    }
  }
  
  // Get the start date of a week (Sunday)
  getWeekStart(date) {
    const result = new Date(date);
    const day = result.getDay();
    result.setDate(result.getDate() - day);
    return result;
  }
  
  // Initialize charts
  initCharts() {
    const ctx = document.getElementById('salesChart').getContext('2d');
    
    // Create the chart
    this.chartInstance = new Chart(ctx, {
      type: 'line',
      data: this.getChartData(),
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                let label = context.dataset.label || '';
                if (label) {
                  label += ': ';
                }
                if (context.parsed.y !== null) {
                  label += '₱' + context.parsed.y.toFixed(2);
                }
                return label;
              }
            }
          }
        },
        scales: {
          x: {
            ticks: {
              maxRotation: 0,
              autoSkip: true,
              maxTicksLimit: 10
            }
          },
          y: {
            beginAtZero: true,
            grid: {
              display: true
            },
            ticks: {
              callback: function(value) {
                return '₱' + value;
              }
            }
          }
        }
      }
    });
    
    // Create top products chart
    this.updateTopProductsChart();
  }
  
  // Get chart data based on current view
  getChartData() {
    const currentData = this.salesData[this.currentView];
    
    return {
      labels: currentData.map(item => item.date),
      datasets: [
        {
          label: 'Sales (₱)',
          data: currentData.map(item => item.sales),
          backgroundColor: 'rgba(79, 70, 229, 0.2)',
          borderColor: 'rgba(79, 70, 229, 1)',
          borderWidth: 2,
          tension: 0.4,
          pointBackgroundColor: 'rgba(79, 70, 229, 1)',
          pointRadius: 4
        },
        {
          label: 'Orders',
          data: currentData.map(item => item.count),
          backgroundColor: 'rgba(16, 185, 129, 0.2)',
          borderColor: 'rgba(16, 185, 129, 1)',
          borderWidth: 2,
          tension: 0.4,
          pointBackgroundColor: 'rgba(16, 185, 129, 1)',
          pointRadius: 4,
          yAxisID: 'orderCount'
        }
      ]
    };
  }
  
  // Update chart with new data
  updateChart() {
    const chartData = this.getChartData();
    
    this.chartInstance.data.labels = chartData.labels;
    this.chartInstance.data.datasets = chartData.datasets;
    this.chartInstance.update();
    
    // Also update top products
    this.updateTopProductsChart();
  }
  
  // Update top products chart
  updateTopProductsChart() {
    const currentData = this.salesData[this.currentView];
    const allItems = {};
    
    // Collect all items across the time period
    currentData.forEach(day => {
      Object.entries(day.items).forEach(([item, count]) => {
        if (!allItems[item]) {
          allItems[item] = 0;
        }
        allItems[item] += count;
      });
    });
    
    // Sort and get top 5
    const topItems = Object.entries(allItems)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    
    const ctx = document.getElementById('topProductsChart').getContext('2d');
    
    // Destroy previous chart if it exists
    if (this.topProductsChart) {
      this.topProductsChart.destroy();
    }
    
    // Create top products chart
    this.topProductsChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: topItems.map(item => item[0]),
        datasets: [{
          data: topItems.map(item => item[1]),
          backgroundColor: [
            'rgba(79, 70, 229, 0.8)',
            'rgba(16, 185, 129, 0.8)',
            'rgba(244, 63, 94, 0.8)',
            'rgba(245, 158, 11, 0.8)',
            'rgba(99, 102, 241, 0.8)'
          ],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const label = context.label || '';
                const value = context.parsed || 0;
                return `${label}: ${value} units`;
              }
            }
          }
        }
      }
    });
  }
  
  // Set up event listeners
  setupEventListeners() {
    // View toggle buttons
    document.querySelectorAll('.time-period-btn').forEach(button => {
      button.addEventListener('click', () => {
        document.querySelectorAll('.time-period-btn').forEach(btn => {
          btn.classList.remove('active');
        });
        
        button.classList.add('active');
        this.currentView = button.dataset.period;
        this.updateChart();
      });
    });
  }
  
  // Update summary cards with latest data
  updateSummaryCards() {
    // Calculate total sales for last 24 hours
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    
    // Find the most recent daily data point
    const todayData = this.salesData.daily[this.salesData.daily.length - 1];
    
    // Update total sales card
    if (todayData) {
      document.querySelector('.stat-card:nth-child(1) .stat-info h2').textContent = `₱${todayData.sales.toFixed(2)}`;
      
      // Calculate percentage change from previous day
      const yesterdayData = this.salesData.daily[this.salesData.daily.length - 2];
      if (yesterdayData && yesterdayData.sales > 0) {
        const percentChange = ((todayData.sales - yesterdayData.sales) / yesterdayData.sales) * 100;
        const progressCircle = document.querySelector('.stat-card:nth-child(1) .progress-circle');
        progressCircle.setAttribute('data-value', Math.abs(percentChange).toFixed(0));
        progressCircle.querySelector('span').textContent = `${Math.abs(percentChange).toFixed(0)}%`;
      }
    }
  }
}

// Initialize analytics when DOM is loaded
document.addEventListener('DOMContentLoaded', async function() {
  // Check if Chart.js is loaded
  if (typeof Chart === 'undefined') {
    // Load Chart.js dynamically
    const chartScript = document.createElement('script');
    chartScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/3.9.1/chart.min.js';
    chartScript.onload = initAnalytics;
    document.head.appendChild(chartScript);
  } else {
    initAnalytics();
  }
});

// Initialize analytics
async function initAnalytics() {
  try {
    const analytics = new AdminAnalytics();
    await analytics.init();
    
    // Make analytics available globally
    window.adminAnalytics = analytics;
  } catch (error) {
    console.error('Failed to initialize analytics:', error);
  }
}

// Export for use in other modules
export { AdminAnalytics };