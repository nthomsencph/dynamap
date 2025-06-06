import { toast } from 'react-toastify';

export function showProminenceToast(locationName: string, prominence: number) {
  toast.info(
    `The location '${locationName}' has a prominence score of ${prominence}. Zoom in to see it.`,
    {
      position: "bottom-right",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
    }
  );
} 