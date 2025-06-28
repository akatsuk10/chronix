"use client"
import React, { useState } from 'react';

function ReportFetcher() {
  
    const [report,setReport] = useState<any>(null)
  // Example feed ID (ETH/USD)

  const fetchReport = async () => {
    
    try {
      const response = await fetch(`/api/feed`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch report');
      }
      
      const data = await response.json();
      if (data.length > 0) {
        setReport(data[0]);
      } else {
        setReport(null);
      }
    } catch (err) {
        console.error("Error fetching report:", err);
        setReport(null);
      }
      
  };
  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Chainlink Report Fetcher</h1>
      
      <button 
        onClick={() => fetchReport()} 
        style={{
          padding: '10px 20px',
          background: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '16px'
        }}
      >
        Fetch report
      </button>
      
      
      
      {report && (
        <div style={{ marginTop: '20px' }}>
          <h2>Report Data:</h2>
          <div style={{
            background: '#f5f5f5',
            padding: '15px',
            borderRadius: '4px',
            overflowX: 'auto'
          }}>
            <pre>{JSON.stringify(report, null, 2)}</pre>

          </div>
        </div>
      )}
    </div>
  );
}

export default ReportFetcher;