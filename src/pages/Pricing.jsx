import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { shopPathForBrand } from '../lib/brands';

const PricingPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Bundles live inside the Shop page itself now; this route only exists
    // for old links. Miracle Natural is the only brand with bundles today.
    navigate(shopPathForBrand('miracle_natural'), { replace: true });
  }, [navigate]);

  return null;
};

export default PricingPage;
