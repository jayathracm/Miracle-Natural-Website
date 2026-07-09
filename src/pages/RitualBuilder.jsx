import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
// eslint-disable-next-line no-unused-vars -- motion is used via JSX (<motion.div>)
import { motion } from 'framer-motion';
import { AlertCircle, ArrowRight, ImageOff, RotateCcw, Sparkles, Sun, Moon, SunMoon } from 'lucide-react';
import { Typography } from '../components/ui/Typography';
import { Button } from '../components/ui/Button';
import { Textarea } from '../components/ui/Textarea';
import { Skeleton } from '../components/ui/Skeleton';
import { supabase } from '../lib/supabaseClient';
import { fetchProducts } from '../lib/products';
import PRODUCT_IMAGES from '../data/productImages';
import { staggerContainer, fadeUpItem, fadeUpEmphasis } from '../lib/motionVariants';

const SKIN_TYPES = [
  { value: 'normal', label: 'Normal' },
  { value: 'dry', label: 'Dry' },
  { value: 'oily', label: 'Oily' },
  { value: 'combination', label: 'Combination' },
  { value: 'sensitive', label: 'Sensitive' },
];

const CONCERNS = [
  'Acne / breakouts',
  'Dullness',
  'Dryness / flaking',
  'Excess oil',
  'Fine lines / aging',
  'Dark spots',
  'Redness / irritation',
  'Uneven texture',
];

const SENSITIVITY_LEVELS = [
  { value: 'low', label: 'Low — rarely reacts to new products' },
  { value: 'medium', label: 'Medium — sometimes reacts' },
  { value: 'high', label: 'High — reacts easily, needs gentle formulas' },
];

const STEP_META = {
  AM: { label: 'Morning', Icon: Sun },
  PM: { label: 'Evening', Icon: Moon },
  'AM/PM': { label: 'Morning & Evening', Icon: SunMoon },
};

const formatCurrency = (amount) => `LKR ${Number(amount).toLocaleString('en-LK')}`;

const RitualBuilder = () => {
  const navigate = useNavigate();
  const [skinType, setSkinType] = useState('');
  const [concerns, setConcerns] = useState([]);
  const [sensitivity, setSensitivity] = useState('');
  const [preferences, setPreferences] = useState('');
  const [formError, setFormError] = useState(null);

  const [status, setStatus] = useState('idle'); // idle | loading | error | done
  const [apiError, setApiError] = useState(null);
  const [result, setResult] = useState(null);

  const [productImageById, setProductImageById] = useState({});

  // Only needed to attach a local bundled image to each recommended
  // product — the Edge Function response itself only returns catalog data,
  // not the Vite-bundled image asset.
  useEffect(() => {
    let isMounted = true;
    fetchProducts()
      .then((rows) => {
        if (!isMounted) return;
        const map = {};
        rows.forEach((product) => {
          map[product.id] = PRODUCT_IMAGES[product.id] || product.image_url || null;
        });
        setProductImageById(map);
      })
      .catch(() => {
        // Non-fatal — recommended products just show a placeholder icon.
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const toggleConcern = (concern) => {
    setConcerns((prev) =>
      prev.includes(concern) ? prev.filter((c) => c !== concern) : [...prev, concern]
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError(null);

    if (!skinType) {
      setFormError('Please select your skin type.');
      return;
    }
    if (concerns.length === 0) {
      setFormError('Please select at least one skin concern.');
      return;
    }
    if (!sensitivity) {
      setFormError('Please select your sensitivity level.');
      return;
    }

    setStatus('loading');
    setApiError(null);

    try {
      const { data, error } = await supabase.functions.invoke('ritual-builder', {
        body: {
          skinType,
          concerns,
          sensitivity,
          preferences: preferences.trim() || undefined,
        },
      });

      if (error) {
        throw error;
      }
      if (data?.error) {
        throw new Error(data.error);
      }

      setResult(data);
      setStatus('done');
    } catch (err) {
      setApiError(err?.message || 'Could not build your routine right now. Please try again.');
      setStatus('error');
    }
  };

  const handleStartOver = () => {
    setResult(null);
    setStatus('idle');
    setApiError(null);
  };

  return (
    <div className="pt-30 sm:pt-32 md:pt-34 pb-14 sm:pb-16 md:pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 sm:mb-10 md:mb-12 rounded-2xl border border-[var(--color-card-border)] bg-[linear-gradient(120deg,rgba(255,251,242,0.95),rgba(247,241,227,0.86))] px-5 py-6 sm:px-7 sm:py-8 md:px-10 md:py-9 shadow-[0_20px_42px_rgba(31,44,35,0.08)]">
          <Typography variant="label" className="mb-3 block">AI Ritual Builder</Typography>
          <Typography variant="h2" className="mb-4 text-foreground text-balance">
            Get a routine picked for your skin
          </Typography>
          <Typography variant="p" className="max-w-2xl">
            Answer a few quick questions and our AI assistant will put together a short routine from
            the Miracle Natural catalog — grounded in real products, with a one-line reason for each.
          </Typography>
        </div>

        {status === 'done' && result ? (
          <motion.div
            variants={fadeUpEmphasis}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            <div className="rounded-2xl border border-[var(--color-card-border)] bg-[linear-gradient(140deg,rgba(255,252,245,0.94),rgba(248,243,231,0.9))] p-5 sm:p-6 shadow-[0_14px_30px_rgba(31,44,35,0.08)]">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={16} className="text-primary" />
                <Typography variant="h4" className="text-foreground">Your Routine</Typography>
              </div>
              <Typography variant="p">{result.summary}</Typography>
            </div>

            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5"
              variants={staggerContainer(0.08)}
              initial="hidden"
              animate="visible"
            >
              {result.routine.map((item, index) => {
                const meta = STEP_META[item.step] || STEP_META['AM/PM'];
                const image = productImageById[item.productId];

                return (
                  <motion.article
                    key={`${item.productId}-${index}`}
                    variants={fadeUpItem}
                    className="rounded-2xl border border-[var(--color-card-border)] bg-[var(--color-card-bg)] overflow-hidden flex flex-col shadow-[0_12px_28px_rgba(31,44,35,0.08)]"
                  >
                    <div className="relative aspect-[4/3] bg-[rgba(255,251,243,0.9)] overflow-hidden">
                      {image ? (
                        <img src={image} alt={item.product.name} className="h-full w-full object-cover object-center" loading="lazy" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-text-tertiary">
                          <ImageOff size={26} />
                        </div>
                      )}
                      <span className="absolute top-2.5 left-2.5 inline-flex items-center gap-1.5 rounded-full border border-white/60 bg-white/85 backdrop-blur-sm px-2.5 py-1 text-[0.66rem] font-bold tracking-[0.08em] uppercase text-foreground">
                        <meta.Icon size={12} className="text-primary" />
                        {meta.label}
                      </span>
                    </div>
                    <div className="p-4 sm:p-5 flex flex-col flex-1">
                      <p className="text-[0.66rem] font-bold tracking-[0.16em] uppercase text-accent mb-1.5">{item.product.category}</p>
                      <Typography variant="h4" className="text-foreground mb-1 leading-snug">{item.product.name}</Typography>
                      {item.product.size && <Typography variant="small" className="block mb-3">{item.product.size}</Typography>}
                      <p className="text-[0.88rem] leading-relaxed text-muted-foreground mb-4">{item.reason}</p>
                      <div className="mt-auto flex items-center justify-between gap-2">
                        <p className="font-display text-[1.3rem] text-primary">{formatCurrency(item.product.price)}</p>
                        <button
                          type="button"
                          onClick={() => navigate(`/shop/${item.productId}`)}
                          className="shrink-0 text-[0.76rem] font-semibold text-primary underline underline-offset-2"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  </motion.article>
                );
              })}
            </motion.div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Button onClick={() => navigate('/shop')} icon={ArrowRight} className="w-full sm:w-auto px-8 py-3">
                Shop These Products
              </Button>
              <Button variant="ghost" icon={RotateCcw} onClick={handleStartOver} className="w-full sm:w-auto px-8 py-3">
                Start Over
              </Button>
            </div>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="rounded-2xl border border-[var(--color-card-border)] bg-[linear-gradient(140deg,rgba(255,252,245,0.94),rgba(248,243,231,0.9))] p-5 sm:p-6 md:p-8 shadow-[0_14px_30px_rgba(31,44,35,0.08)] space-y-6">
            <div>
              <p className="mb-2.5 text-[0.7rem] font-bold tracking-[0.1em] uppercase text-text-secondary">Skin Type</p>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {SKIN_TYPES.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setSkinType(option.value)}
                    className={`rounded-lg border px-3 py-2.5 text-[0.84rem] font-semibold transition-colors ${skinType === option.value ? 'border-primary bg-primary/10 text-primary' : 'border-[var(--color-border-medium)] bg-white/85 text-foreground hover:bg-white'}`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2.5 text-[0.7rem] font-bold tracking-[0.1em] uppercase text-text-secondary">Skin Concerns (select all that apply)</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {CONCERNS.map((concern) => (
                  <button
                    key={concern}
                    type="button"
                    onClick={() => toggleConcern(concern)}
                    className={`rounded-lg border px-3 py-2.5 text-[0.84rem] font-semibold text-left transition-colors ${concerns.includes(concern) ? 'border-primary bg-primary/10 text-primary' : 'border-[var(--color-border-medium)] bg-white/85 text-foreground hover:bg-white'}`}
                  >
                    {concern}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2.5 text-[0.7rem] font-bold tracking-[0.1em] uppercase text-text-secondary">Sensitivity Level</p>
              <div className="space-y-2">
                {SENSITIVITY_LEVELS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setSensitivity(option.value)}
                    className={`w-full rounded-lg border px-3 py-2.5 text-[0.84rem] font-semibold text-left transition-colors ${sensitivity === option.value ? 'border-primary bg-primary/10 text-primary' : 'border-[var(--color-border-medium)] bg-white/85 text-foreground hover:bg-white'}`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2.5 text-[0.7rem] font-bold tracking-[0.1em] uppercase text-text-secondary">Preferences (optional)</p>
              <Textarea
                placeholder="e.g. fragrance-free, prefer lightweight textures..."
                value={preferences}
                onChange={(e) => setPreferences(e.target.value)}
                rows={2}
              />
            </div>

            {formError && (
              <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-[0.85rem] text-red-700">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {status === 'error' && apiError && (
              <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-[0.85rem] text-red-700">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <span>{apiError}</span>
              </div>
            )}

            {status === 'loading' ? (
              <div className="space-y-3">
                <Skeleton className="h-11 w-full" />
                <p className="text-center text-[0.82rem] text-muted-foreground">Building your routine...</p>
              </div>
            ) : (
              <Button type="submit" icon={Sparkles} className="w-full sm:w-auto px-8 py-3">
                Build My Routine
              </Button>
            )}
          </form>
        )}
      </div>
    </div>
  );
};

export default RitualBuilder;
