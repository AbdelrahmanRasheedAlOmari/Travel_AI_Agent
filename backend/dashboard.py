import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from datetime import datetime, timedelta
import sqlite3
import os
import json
import calendar

# Set page config
st.set_page_config(
    page_title="Dubai Tourism Demographics Analysis",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Professional styling
st.markdown("""
    <style>
    .main { background-color: #FFFFFF; }
    .stMetric {
        background-color: #F8F9FA;
        padding: 20px;
        border-radius: 5px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.12);
    }
    </style>
""", unsafe_allow_html=True)

st.title("Dubai Tourism Demographics Analysis")
st.markdown("Department of Economy and Tourism | Visitor Demographics Dashboard")

# Time period selector
st.header("Booking Analysis Period")
time_period = st.selectbox(
    "Select Analysis Period",
    [
        "Current Quarter",
        "Next Quarter",
        "Next 6 Months",
        "Next 12 Months",
        "Custom Period"
    ]
)

# Calculate dates based on selection
current_date = datetime.now()
current_quarter = (current_date.month - 1) // 3 + 1

if time_period == "Custom Period":
    col1, col2 = st.columns(2)
    with col1:
        start_date = st.date_input(
            "From Date",
            value=current_date
        )
    with col2:
        end_date = st.date_input(
            "To Date",
            value=current_date + timedelta(days=365)
        )
else:
    if time_period == "Current Quarter":
        start_date = datetime(current_date.year, 3 * ((current_date.month - 1) // 3) + 1, 1)
        end_date = datetime(current_date.year + (current_date.month + 2) // 12,
                          ((current_date.month + 2) % 12) + 1, 1) - timedelta(days=1)
    elif time_period == "Next Quarter":
        next_quarter_month = 3 * (((current_date.month - 1) // 3 + 1) % 4) + 1
        next_quarter_year = current_date.year + (current_date.month + 2) // 12
        
        start_date = datetime(next_quarter_year, next_quarter_month, 1)
        if next_quarter_month > 9:
            end_quarter_year = next_quarter_year + 1
            end_quarter_month = (next_quarter_month + 2) % 12 + 1
        else:
            end_quarter_year = next_quarter_year
            end_quarter_month = next_quarter_month + 2
        
        end_date = datetime(end_quarter_year, end_quarter_month, 1) - timedelta(days=1)
    elif time_period == "Next 6 Months":
        start_date = current_date
        end_date = current_date + timedelta(days=180)
    else:  # Next 12 Months
        start_date = current_date
        end_date = current_date + timedelta(days=365)

st.markdown(f"""
    **Analyzing bookings from:** {start_date.strftime('%B %d, %Y')} to {end_date.strftime('%B %d, %Y')}
""")

@st.cache_data
def load_data():
    try:
        db_path = os.path.join(os.path.dirname(__file__), 'data', 'user_interactions.db')
        
        if not os.path.exists(db_path):
            return pd.DataFrame()

        conn = sqlite3.connect(db_path)
        
        # Load all data first
        df = pd.read_sql_query('SELECT * FROM user_interactions', conn)
        conn.close()

        if not df.empty:
            try:
                # Debug print
                st.write("Raw travel dates:", df['travel_dates'].iloc[0])
                
                # Parse travel_dates from JSON string
                df['travel_dates'] = df['travel_dates'].apply(lambda x: json.loads(x) if isinstance(x, str) else x)
                
                # Extract start and end dates
                df['travel_start'] = df['travel_dates'].apply(lambda x: datetime.strptime(x['from'], '%Y-%m-%d').date())
                df['travel_end'] = df['travel_dates'].apply(lambda x: datetime.strptime(x['to'], '%Y-%m-%d').date())
                
                # Convert start_date and end_date to date objects if they're datetime
                start_date_filter = start_date.date() if isinstance(start_date, datetime) else start_date
                end_date_filter = end_date.date() if isinstance(end_date, datetime) else end_date
                
                # Debug prints
                st.write("Filter dates:", start_date_filter, "to", end_date_filter)
                st.write("First row travel dates:", df['travel_start'].iloc[0], "to", df['travel_end'].iloc[0])
                
                # Filter based on travel dates
                mask = (
                    (df['travel_start'] >= start_date_filter) & 
                    (df['travel_end'] <= end_date_filter)
                )
                df = df[mask]

                if df.empty:
                    st.info(f"No bookings found for the selected period: {start_date_filter} to {end_date_filter}")
                    return pd.DataFrame()
                
            except Exception as e:
                st.error(f"Error processing dates: {e}")
                return pd.DataFrame()

        return df

    except Exception as e:
        st.error(f"Error loading data: {e}")
        return pd.DataFrame()

df = load_data()

if not df.empty:
    # Geographic Analysis
    st.header("Global Visitor Demographics")
    
    col1, col2 = st.columns([2, 1])
    
    with col1:
        # Enhanced map visualization
        city_coordinates = {
            'London': {'lat': 51.5074, 'lon': -0.1278, 'country': 'GBR'},
            'Paris': {'lat': 48.8566, 'lon': 2.3522, 'country': 'FRA'},
            'New York': {'lat': 40.7128, 'lon': -74.0060, 'country': 'USA'},
            'Tokyo': {'lat': 35.6762, 'lon': 139.6503, 'country': 'JPN'},
            'Dubai': {'lat': 25.2048, 'lon': 55.2708, 'country': 'ARE'},
            'Mumbai': {'lat': 19.0760, 'lon': 72.8777, 'country': 'IND'},
            'Sydney': {'lat': -33.8688, 'lon': 151.2093, 'country': 'AUS'},
            'Singapore': {'lat': 1.3521, 'lon': 103.8198, 'country': 'SGP'},
            'Manchester': {'lat': 53.4808, 'lon': -2.2426, 'country': 'GBR'},
            'Beijing': {'lat': 39.9042, 'lon': 116.4074, 'country': 'CHN'},
            'Moscow': {'lat': 55.7558, 'lon': 37.6173, 'country': 'RUS'},
            'Istanbul': {'lat': 41.0082, 'lon': 28.9784, 'country': 'TUR'}
        }
        
        # Prepare data for the map
        visitor_locations = df['departure_location'].value_counts().reset_index()
        visitor_locations.columns = ['city', 'visitors']
        
        # Create map data
        map_data = []
        for _, row in visitor_locations.iterrows():
            city = row['city'].title()
            if city in city_coordinates:
                map_data.append({
                    'city': city,
                    'visitors': row['visitors'],
                    'lat': city_coordinates[city]['lat'],
                    'lon': city_coordinates[city]['lon'],
                    'country': city_coordinates[city]['country']
                })
        
        map_df = pd.DataFrame(map_data)
        
        if not map_df.empty:
            fig = go.Figure()

            # Base map layer
            fig.add_trace(go.Choropleth(
                locations=list(set(city_coordinates[city]['country'] for city in city_coordinates)),
                z=[1] * len(set(city_coordinates[city]['country'] for city in city_coordinates)),
                colorscale=[[0, '#e6f3ff'], [1, '#e6f3ff']],
                showscale=False,
                marker_line_color='#ffffff',
                marker_line_width=1
            ))

            # City markers
            fig.add_trace(go.Scattergeo(
                lon=map_df['lon'].tolist(),
                lat=map_df['lat'].tolist(),
                text=map_df.apply(lambda x: f"{x['city']}: {x['visitors']} visitors", axis=1),
                mode='markers+text',
                marker=dict(
                    size=map_df['visitors'] / map_df['visitors'].max() * 50,
                    color='#C5A059',
                    opacity=0.7,
                    line=dict(color='#ffffff', width=1)
                ),
                textposition='top center',
                name='Visitor Origins'
            ))

            # Connection lines to Dubai
            dubai_coords = city_coordinates['Dubai']
            for _, row in map_df.iterrows():
                fig.add_trace(go.Scattergeo(
                    lon=[row['lon'], dubai_coords['lon']],
                    lat=[row['lat'], dubai_coords['lat']],
                    mode='lines',
                    line=dict(
                        width=1,
                        color='rgba(197, 160, 89, 0.3)',
                        dash='solid'
                    ),
                    showlegend=False
                ))

            fig.update_layout(
                title='Global Distribution of Visitors',
                showlegend=False,
                geo=dict(
                    showland=True,
                    showcountries=True,
                    showocean=True,
                    countrywidth=0.5,
                    landcolor='#f8f9fa',
                    oceancolor='#eef6ff',
                    projection_type='equirectangular',
                    center=dict(lon=55.2708, lat=25.2048),
                    projection_scale=1.5
                ),
                height=600,
                margin=dict(l=0, r=0, t=30, b=0)
            )
            
            st.plotly_chart(fig, use_container_width=True)

    with col2:
        # Top source markets analysis
        st.subheader("Top Source Markets")
        
        # Calculate market share
        total_visitors = visitor_locations['visitors'].sum()
        visitor_locations['market_share'] = (visitor_locations['visitors'] / total_visitors * 100).round(1)
        
        # Styling for market cards
        st.markdown("""
            <style>
            .market-card {
                padding: 12px;
                margin: 8px 0;
                background-color: #f8f9fa;
                border-radius: 8px;
                border-left: 4px solid #C5A059;
                box-shadow: 0 2px 4px rgba(0,0,0,0.05);
            }
            .market-card:hover {
                background-color: #f0f2f5;
                transform: translateX(2px);
                transition: all 0.2s ease;
            }
            .market-name {
                color: #2c3e50;
                font-size: 16px;
                font-weight: 500;
            }
            .market-stats {
                color: #C5A059;
                font-weight: 500;
                font-size: 14px;
            }
            .market-share {
                color: #666;
                font-size: 12px;
                margin-top: 4px;
            }
            </style>
        """, unsafe_allow_html=True)
        
        # Display market cards
        for _, row in visitor_locations.head(10).iterrows():
            st.markdown(f"""
                <div class="market-card">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span class="market-name">{row['city'].title()}</span>
                        <span class="market-stats">{row['visitors']} visitors</span>
                    </div>
                    <div class="market-share">
                        Market Share: {row['market_share']}%
                        <div style="
                            width: {row['market_share']}%;
                            height: 4px;
                            background-color: #C5A059;
                            border-radius: 2px;
                            margin-top: 4px;
                        "></div>
                    </div>
                </div>
            """, unsafe_allow_html=True)

    def create_peak_travel_analysis(df):
        st.header("Peak Travel Dates Analysis")
        
        # Convert timestamp to datetime if it's not already
        df['timestamp'] = pd.to_datetime(df['timestamp'], errors='coerce')
        df = df.dropna(subset=['timestamp'])
        
        # Add year and month columns
        df['year'] = df['timestamp'].dt.year
        df['month'] = df['timestamp'].dt.month
        df['month_name'] = df['timestamp'].dt.strftime('%B')
        df['date'] = df['timestamp'].dt.strftime('%Y-%m-%d')
        
        # Create filters in a nice container
        with st.container():
            col1, col2, col3 = st.columns([2,2,3])
            
            with col1:
                years = sorted(df['year'].unique())
                selected_year = st.selectbox(
                    "Select Year",
                    years,
                    index=len(years)-1,
                    key="year_selector"
                )
            
            with col2:
                months = sorted(df[df['year'] == selected_year]['month'].unique())
                month_names = [calendar.month_name[m] for m in months]
                selected_month_name = st.selectbox(
                    "Select Month",
                    ["All Months"] + month_names,
                    key="month_selector"
                )
            
            with col3:
                granularity = st.radio(
                    "View By",
                    ["Daily", "Monthly"],
                    horizontal=True,
                    key="granularity_selector"
                )
        
        # Filter data based on selections
        filtered_df = df[df['year'] == selected_year]
        if selected_month_name != "All Months":
            selected_month = list(calendar.month_name).index(selected_month_name)
            filtered_df = filtered_df[filtered_df['month'] == selected_month]
        
        col1, col2 = st.columns(2)
        
        if granularity == "Daily":
            try:
                # Daily analysis with proper date handling
                daily_counts = filtered_df.groupby('date').size().reset_index(name='count')
                daily_counts['date'] = pd.to_datetime(daily_counts['date'])
                
                fig_daily = px.line(
                    daily_counts,
                    x='date',
                    y='count',
                    title=f'Daily Travel Trends - {selected_month_name} {selected_year}',
                    labels={'date': 'Date', 'count': 'Number of Travelers'}
                )
                fig_daily.update_traces(
                    line_color='#C5A059',
                    line_width=2,
                    mode='lines+markers',
                    marker=dict(size=6, color='#C5A059')
                )
                col1.plotly_chart(fig_daily, use_container_width=True)
                
                # Peak days analysis
                peak_days = daily_counts.nlargest(5, 'count')
                col2.subheader(f"Top 5 Peak Travel Days - {selected_month_name} {selected_year}")
                
                for _, row in peak_days.iterrows():
                    with col2.container():
                        st.markdown(
                            f"""
                            <div style="
                                padding: 1rem;
                                background-color: #f8f9fa;
                                border-radius: 0.5rem;
                                border-left: 4px solid #C5A059;
                                margin-bottom: 0.5rem;
                            ">
                                <div style="color: #2c3e50; font-size: 1.1rem; font-weight: 500;">
                                    {row['date'].strftime('%B %d, %Y')}
                                </div>
                                <div style="color: #C5A059; font-size: 1.2rem; font-weight: 600;">
                                    {row['count']} travelers
                                </div>
                                <div style="color: #666; font-size: 0.9rem; margin-top: 0.5rem;">
                                    {row['date'].strftime('%A')}
                                </div>
                            </div>
                            """,
                            unsafe_allow_html=True
                        )
                
            except Exception as e:
                st.error(f"Error processing daily data: {str(e)}")
                st.error("Debug info:")
                st.write("DataFrame columns:", df.columns.tolist())
                st.write("Sample data:", df.head())
                
        else:
            try:
                monthly_counts = filtered_df.groupby(['year', 'month_name']).size().reset_index(name='count')
                
                # Create an enhanced bar chart
                fig_monthly = px.bar(
                    monthly_counts,
                    x='month_name',
                    y='count',
                    title=f'Monthly Travel Trends - {selected_year}',
                    labels={'month_name': 'Month', 'count': 'Number of Travelers'}
                )
                fig_monthly.update_traces(
                    marker_color='#C5A059',
                    hovertemplate='<b>%{x}</b><br>Travelers: %{y}<extra></extra>'
                )
                fig_monthly.update_layout(
                    xaxis_title="Month",
                    yaxis_title="Number of Travelers",
                    hovermode='x unified',
                    plot_bgcolor='white',
                    paper_bgcolor='white',
                    xaxis=dict(gridcolor='#f0f0f0'),
                    yaxis=dict(gridcolor='#f0f0f0')
                )
                col1.plotly_chart(fig_monthly, use_container_width=True)
                
                # Enhanced peak months analysis
                peak_months = monthly_counts.nlargest(5, 'count')
                col2.subheader(f"Top 5 Peak Travel Months - {selected_year}")
                
                for _, row in peak_months.iterrows():
                    with col2.container():
                        st.markdown(
                            f"""
                            <div style="
                                padding: 1rem;
                                background-color: #f8f9fa;
                                border-radius: 0.5rem;
                                border-left: 4px solid #C5A059;
                                margin-bottom: 0.5rem;
                                transition: transform 0.2s;
                            "
                            onmouseover="this.style.transform='translateX(5px)'"
                            onmouseout="this.style.transform='translateX(0px)'">
                                <div style="color: #2c3e50; font-size: 1.1rem; font-weight: 500;">
                                    {row['month_name']} {selected_year}
                                </div>
                                <div style="color: #C5A059; font-size: 1.2rem; font-weight: 600;">
                                    {row['count']} travelers
                                </div>
                                <div style="color: #666; font-size: 0.9rem; margin-top: 0.5rem;">
                                    Peak Travel Month
                                </div>
                            </div>
                            """,
                            unsafe_allow_html=True
                        )
                    
            except Exception as e:
                st.error(f"Error processing monthly data: {str(e)}")

    create_peak_travel_analysis(df)

    def create_duration_analysis(df):
        # Add more padding and margin to the header
        st.markdown("""
            <style>
            .duration-header {
                color: #2c3e50;
                padding: 2rem 2.5rem;  /* Increased padding */
                margin: 2rem 0;        /* Added margin */
                border-radius: 1rem;   /* Increased border radius */
                background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
                border-left: 6px solid #C5A059;
                box-shadow: 0 4px 6px rgba(0,0,0,0.05);
            }
            .metric-container {
                background: white;
                padding: 2rem;         /* Increased padding */
                margin: 1.5rem 0;      /* Added margin */
                border-radius: 1rem;
                box-shadow: 0 4px 6px rgba(0,0,0,0.05);
                transition: transform 0.2s;
            }
            .metric-container:hover {
                transform: translateY(-5px);
                box-shadow: 0 8px 15px rgba(0,0,0,0.1);
            }
            .insight-card {
                background: #f8f9fa;
                padding: 1.5rem;       /* Increased padding */
                margin: 1rem 0;        /* Increased margin */
                border-radius: 0.75rem;
                border-left: 4px solid #C5A059;
            }
            .chart-container {
                background: white;
                padding: 1.5rem;
                margin: 2rem 0;
                border-radius: 1rem;
                box-shadow: 0 4px 6px rgba(0,0,0,0.05);
            }
            </style>
            
            <div class="duration-header">
                <h2 style="font-size: 2.25rem; font-weight: 600; margin-bottom: 1rem;">
                    Average Duration of Stay Analysis
                </h2>
                <p style="color: #666; font-size: 1.2rem; line-height: 1.6;">
                    Comprehensive analysis of visitor stay duration patterns in Dubai
                </p>
            </div>
        """, unsafe_allow_html=True)

        # Add spacing between sections
        st.markdown("<div style='height: 2rem'></div>", unsafe_allow_html=True)

        # Create month column from travel_start instead of timestamp
        df['month'] = pd.to_datetime(df['travel_start']).dt.strftime('%B')
        
        # Calculate key metrics
        avg_duration = df['duration_days'].mean()
        median_duration = df['duration_days'].median()
        min_duration = df['duration_days'].min()
        max_duration = df['duration_days'].max()

        # Create three columns with spacing
        col1, space1, col2, space2, col3 = st.columns([1, 0.1, 1, 0.1, 1])

        with col1:
            st.markdown("""
                <div class="metric-container">
                    <h3 style="color: #C5A059; font-size: 2rem; font-weight: 600; margin-bottom: 1rem;">
                        {:.1f} Days
                    </h3>
                    <p style="color: #666; font-size: 1.1rem;">Average Stay Duration</p>
                </div>
            """.format(avg_duration), unsafe_allow_html=True)

        with col2:
            st.markdown("""
                <div class="metric-container">
                    <h3 style="color: #C5A059; font-size: 2rem; font-weight: 600; margin-bottom: 1rem;">
                        {:.1f} Days
                    </h3>
                    <p style="color: #666; font-size: 1.1rem;">Median Stay Duration</p>
                </div>
            """.format(median_duration), unsafe_allow_html=True)

        with col3:
            st.markdown("""
                <div class="metric-container">
                    <h3 style="color: #C5A059; font-size: 2rem; font-weight: 600; margin-bottom: 1rem;">
                        {:.1f} Days
                    </h3>
                    <p style="color: #666; font-size: 1.1rem;">Most Common Duration</p>
                </div>
            """.format(df['duration_days'].mode().iloc[0]), unsafe_allow_html=True)

        # Add spacing before charts
        st.markdown("<div style='height: 3rem'></div>", unsafe_allow_html=True)

        # Create two columns for charts with spacing
        col1, space, col2 = st.columns([1, 0.1, 1])

        with col1:
            fig_hist = px.histogram(
                df,
                x='duration_days',
                nbins=20,
                title='Distribution of Stay Duration',
                labels={'duration_days': 'Duration (Days)', 'count': 'Number of Visitors'},
                color_discrete_sequence=['#C5A059']
            )
            fig_hist.update_layout(
                plot_bgcolor='white',
                paper_bgcolor='white',
                title_font=dict(size=20, color='#2c3e50'),
                title_x=0.5,
                showlegend=False,
                hovermode='x unified',
                xaxis=dict(gridcolor='#f0f0f0'),
                yaxis=dict(gridcolor='#f0f0f0'),
                margin=dict(t=60, b=40, l=40, r=40)
            )
            st.plotly_chart(fig_hist, use_container_width=True)

        with col2:
            # Create a seasonal analysis
            seasonal_avg = df.groupby('month')['duration_days'].agg(['mean', 'count']).reset_index()
            seasonal_avg = seasonal_avg.sort_values('month', key=lambda x: pd.to_datetime(x, format='%B'))
            
            fig_seasonal = px.bar(
                seasonal_avg,
                x='month',
                y='mean',
                title='Average Stay Duration by Month',
                labels={
                    'month': 'Month',
                    'mean': 'Average Duration (Days)',
                    'count': 'Number of Visitors'
                },
                color_discrete_sequence=['#C5A059']
            )
            fig_seasonal.update_layout(
                plot_bgcolor='white',
                paper_bgcolor='white',
                title_font=dict(size=20, color='#2c3e50'),
                title_x=0.5,
                showlegend=False,
                hovermode='x unified',
                xaxis=dict(gridcolor='#f0f0f0'),
                yaxis=dict(gridcolor='#f0f0f0'),
                margin=dict(t=60, b=40, l=40, r=40)
            )
            # Add hover template
            fig_seasonal.update_traces(
                hovertemplate="<b>%{x}</b><br>" +
                             "Average Duration: %{y:.1f} days<br>" +
                             "Number of Visitors: %{customdata}<extra></extra>",
                customdata=seasonal_avg['count']
            )
            st.plotly_chart(fig_seasonal, use_container_width=True)

        # Add spacing before insights
        st.markdown("<div style='height: 3rem'></div>", unsafe_allow_html=True)

        # Key Insights Section with more spacing
        st.markdown("""
            <h3 style="color: #2c3e50; font-size: 1.75rem; font-weight: 600; margin: 2rem 0 1.5rem 0;">
                Key Insights
            </h3>
        """, unsafe_allow_html=True)

        insights = [
            f"The average stay duration is {avg_duration:.1f} days, with a median of {median_duration:.1f} days.",
            f"Stay durations range from {min_duration:.0f} to {max_duration:.0f} days.",
            f"Most visitors ({(df['duration_days'].between(avg_duration-2, avg_duration+2).mean()*100):.1f}%) stay within 2 days of the average duration."
        ]

        for insight in insights:
            st.markdown(f"""
                <div class="insight-card">
                    <div style="display: flex; align-items: center; gap: 1rem;">
                        <span style="color: #C5A059; font-size: 1.4rem;">•</span>
                        <span style="color: #2c3e50; font-size: 1.2rem; line-height: 1.6;">{insight}</span>
                    </div>
                </div>
            """, unsafe_allow_html=True)

    create_duration_analysis(df)

else:
    st.info("""
        No data available yet. The dashboard will populate automatically when users interact with Sayih.
        
        Waiting for:
        - User interactions
        - Travel preferences
        - Booking information
        - Demographic data
    """)
  