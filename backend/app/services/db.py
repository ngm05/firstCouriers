import os
from dotenv import load_dotenv
from supabase import Client, create_client

load_dotenv(dotenv_path="backend/.env")

supabase_url: str = os.environ.get("SUPABASE_URL")
supabase_key: str = os.environ.get("SUPABASE_KEY")

supabase: Client = create_client(supabase_url, supabase_key)