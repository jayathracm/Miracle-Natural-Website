import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const PricingPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/shop', { replace: true });
  }, [navigate]);

  return null;
};

export default PricingPage;
