import React from 'react';

const LoadingOverlay: React.FC = () => {
  return (
    <div 
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        color: 'white',
        zIndex: 100,
      }}
    >
      <div 
        style={{
          width: '50px',
          height: '50px',
          border: '5px solid rgba(255, 102, 171, 0.3)',
          borderRadius: '50%',
          borderTop: '5px solid #ff66ab',
          animation: 'spin 1s linear infinite',
        }}
      />
      <p style={{ marginTop: '20px', fontSize: '18px' }}>Loading...</p>
      
      {/* Add keyframes for the spinner animation */}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default LoadingOverlay;
