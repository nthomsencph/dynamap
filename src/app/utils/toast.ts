import { toast } from 'react-toastify';

export function showProminenceToast(
  locationName: string,
  prominence: { lower: number; upper: number } | number
) {
  const prominenceText =
    typeof prominence === 'number'
      ? prominence.toString()
      : `${prominence.lower}-${prominence.upper}`;

  toast.info(
    `The location '${locationName}' has a prominence range of ${prominenceText}. Zoom in to see it.`,
    {
      position: 'bottom-right',
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
    }
  );
}
