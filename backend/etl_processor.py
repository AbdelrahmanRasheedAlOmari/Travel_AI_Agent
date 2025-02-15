import sqlite3
import os
from datetime import datetime
from typing import Dict, Any
import json

class ETLProcessor:
    def __init__(self):
        self.db_path = os.path.join(os.path.dirname(__file__), 'data', 'user_interactions.db')
        self._ensure_data_directory()
        self._init_database()

    def _ensure_data_directory(self):
        data_dir = os.path.join(os.path.dirname(__file__), 'data')
        os.makedirs(data_dir, exist_ok=True)

    def _init_database(self):
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        # Update the table schema to include duration_days
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS user_interactions (
            interaction_id TEXT PRIMARY KEY,
            timestamp DATETIME,
            departure_location TEXT,
            travel_dates TEXT,
            duration_days INTEGER,
            group_size TEXT,
            budget TEXT,
            interests TEXT,
            generated_itinerary BOOLEAN
        )
        ''')

        conn.commit()
        conn.close()

    def store_interaction(self, data: Dict[str, Any]):
        """Store a user interaction in the database"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        try:
            # Debug print
            print("Storing data:", data)
            print("Departure location:", data.get('departureLocation'))

            # Calculate duration_days from dateRange
            date_range = json.loads(data.get('dateRange', '{}'))
            if date_range and 'from' in date_range and 'to' in date_range:
                from_date = datetime.strptime(date_range['from'], '%Y-%m-%d')
                to_date = datetime.strptime(date_range['to'], '%Y-%m-%d')
                duration = (to_date - from_date).days + 1
            else:
                duration = 0

            cursor.execute('''
                INSERT INTO user_interactions 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                f"int_{datetime.now().strftime('%Y%m%d%H%M%S')}",
                datetime.now(),
                data.get('departureLocation'),
                data.get('dateRange'),
                duration,
                data.get('groupSize'),
                data.get('budget'),
                data.get('interests'),
                bool(data.get('travelPlan'))
            ))

            conn.commit()
            print("Interaction stored successfully")

            # Debug query to verify data
            cursor.execute("SELECT * FROM user_interactions")
            print("Current database contents:", cursor.fetchall())

        except Exception as e:
            print(f"Error storing interaction: {e}")
            conn.rollback()
        finally:
            conn.close()