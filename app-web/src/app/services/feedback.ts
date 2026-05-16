import { toast } from 'sonner';

type FeedbackOptions = Parameters<typeof toast>[1];
type FeedbackPromise = Parameters<typeof toast.promise>[0];
type FeedbackPromiseOptions<TData> = Parameters<typeof toast.promise<TData>>[1];

const DEFAULT_DURATION = 4500;

export const feedback = {
  success(message: string, options?: FeedbackOptions) {
    return toast.success(message, { duration: DEFAULT_DURATION, ...options });
  },

  error(message: string, options?: FeedbackOptions) {
    return toast.error(message, { duration: DEFAULT_DURATION, ...options });
  },

  info(message: string, options?: FeedbackOptions) {
    return toast.info(message, { duration: DEFAULT_DURATION, ...options });
  },

  promise<TData>(promise: FeedbackPromise, options?: FeedbackPromiseOptions<TData>) {
    return toast.promise<TData>(promise, options);
  },

  dismiss(id?: Parameters<typeof toast.dismiss>[0]) {
    return toast.dismiss(id);
  },
};
