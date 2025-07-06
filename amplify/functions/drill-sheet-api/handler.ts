import type { APIGatewayProxyHandler } from 'aws-lambda';
import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.DB_HOST,
  port: 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: { rejectUnauthorized: false },
});

export const handler: APIGatewayProxyHandler = async (event) => {
  const { httpMethod, path, body, headers } = event;
  
  try {
    // Extract user info from Cognito JWT
    const authToken = headers.Authorization?.replace('Bearer ', '');
    if (!authToken) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Unauthorized' }),
      };
    }

    // Route handling
    if (path === '/analytics/dashboard' && httpMethod === 'GET') {
      return await getDashboardAnalytics();
    }
    
    if (path === '/reports/drill-specifications' && httpMethod === 'GET') {
      return await getDrillSpecificationReport();
    }

    return {
      statusCode: 404,
      body: JSON.stringify({ error: 'Not found' }),
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};

async function getDashboardAnalytics() {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT 
        COUNT(DISTINCT c.customer_id) as total_customers,
        COUNT(DISTINCT dwo.work_order_id) as total_work_orders,
        AVG(dwo.customer_satisfaction) as avg_satisfaction,
        SUM(dwo.total_cost) as total_revenue
      FROM customers c
      LEFT JOIN bowling_balls bb ON c.customer_id = bb.customer_id
      LEFT JOIN drill_work_orders dwo ON bb.ball_id = dwo.ball_id
      WHERE dwo.work_date >= CURRENT_DATE - INTERVAL '30 days'
    `);
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(result.rows[0]),
    };
  } finally {
    client.release();
  }
}

async function getDrillSpecificationReport() {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT 
        ds.grip_style,
        AVG(ds.thumb_to_middle_fit) as avg_thumb_middle_span,
        AVG(ds.thumb_to_ring_fit) as avg_thumb_ring_span,
        COUNT(*) as specification_count
      FROM drill_sheets ds
      GROUP BY ds.grip_style
      ORDER BY specification_count DESC
    `);
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(result.rows),
    };
  } finally {
    client.release();
  }
}
