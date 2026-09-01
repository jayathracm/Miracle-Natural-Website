import React, { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { shopPathForBrand } from '@/shared/lib/brands';

const PricingPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Legacy /pricing route from before pricing lived on the Shop page.
    // Kept as a redirect so old links still land somewhere useful.
    navigate(shopPathForBrand('miracle_natural'), { replace: true });
  }, [navigate]);

  return null;
};

export default PricingPage;
