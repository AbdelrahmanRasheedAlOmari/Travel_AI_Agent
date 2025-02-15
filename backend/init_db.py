from etl_processor import ETLProcessor

def initialize_database():
    processor = ETLProcessor()
    print("Database initialized successfully!")

if __name__ == "__main__":
    initialize_database() 