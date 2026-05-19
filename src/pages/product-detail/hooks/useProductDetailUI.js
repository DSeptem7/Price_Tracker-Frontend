import { useState } from 'react';

export const useProductDetailUI = () => {
  const [timeRange, setTimeRange] = useState('3m');
  const [isChanging, setIsChanging] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleRangeChange = (range) => {
    setIsChanging(true);
    setTimeRange(range);

    setTimeout(() => {
      setIsChanging(false);
    }, 300);
  };

  const toggleModal = () => {
    setIsModalOpen((prev) => {
      const next = !prev;

      document.body.style.overflow = next
        ? 'hidden'
        : 'unset';

      return next;
    });
  };

  return {
    timeRange,
    isChanging,
    isModalOpen,
    handleRangeChange,
    toggleModal
  };
};