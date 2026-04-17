"""
test_snowflake_conn.py — Quick connectivity test.
Usage: SNOWFLAKE_PASSWORD=xxx python scripts/test_snowflake_conn.py
"""
import os
import snowflake.connector


def run():
    creds = dict(
        account="BI24418.central-india.azure",
        user=os.getenv("SNOWFLAKE_USER", "consul_predict_svc"),
        password=os.getenv("SNOWFLAKE_PASSWORD", ""),
        warehouse="COMPUTE_WH",
    )
    print("Testing ITSM_DB.INCIDENT_ANALYTICS...")
    conn = snowflake.connector.connect(**creds, database="ITSM_DB", schema="INCIDENT_ANALYTICS")
    cur = conn.cursor()
    cur.execute("SELECT COUNT(*) FROM INCIDENT_HISTORY")
    print(f"  INCIDENT_HISTORY rows: {cur.fetchone()[0]}")
    cur.execute("SELECT COUNT(*) FROM CI_INCIDENT_AGG")
    print(f"  CI_INCIDENT_AGG rows: {cur.fetchone()[0]}")
    conn.close()

    print("Testing CONSUL_PREDICT.PUBLIC...")
    conn = snowflake.connector.connect(**creds, database="CONSUL_PREDICT", schema="PUBLIC")
    cur = conn.cursor()
    cur.execute("SELECT COUNT(*) FROM PREDICTION_LOG")
    print(f"  PREDICTION_LOG rows: {cur.fetchone()[0]}")
    conn.close()
    print("All connections OK.")


if __name__ == "__main__":
    run()
