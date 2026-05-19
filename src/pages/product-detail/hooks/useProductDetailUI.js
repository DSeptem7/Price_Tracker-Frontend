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
    setIsModalOpen(!isModalOpen);

    if (!isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  };

  return {
    timeRange,
    isChanging,
    isModalOpen,
    handleRangeChange,
    toggleModal
  };

};