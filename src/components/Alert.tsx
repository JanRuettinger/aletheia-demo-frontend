import React from 'react';
import {
  ExclamationIcon,
  XCircleIcon,
  CheckCircleIcon,
} from '@heroicons/react/solid';

type propsType = {
  alertType: string;
  alertText: string;
  alertHidden: boolean;
};

export default function Alert({
  alertType,
  alertText,
  alertHidden,
}: propsType) {
  if (alertHidden) {
    return <div></div>;
  }
  if (alertType == 'warning') {
    return (
      <div className='rounded-md bg-yellow-50 p-4'>
        <div className='flex'>
          <div className='flex-shrink-0'>
            <ExclamationIcon
              className='h-5 w-5 text-yellow-400'
              aria-hidden='true'
            />
          </div>
          <div className='ml-3'>
            <h3 className='text-sm font-medium text-yellow-800'>
              Attention needed
            </h3>
            <div className='mt-2 text-sm text-yellow-700'>
              <p>{alertText}</p>
            </div>
          </div>
        </div>
      </div>
    );
  } else if (alertType == 'error') {
    return (
      <div className='rounded-md bg-yellow-50 p-4'>
        <div className='flex'>
          <div className='flex-shrink-0'>
            <XCircleIcon className='h-5 w-5 text-red-400' aria-hidden='true' />
          </div>
          <div className='ml-3'>
            <h3 className='text-sm font-medium text-red-800'>Error</h3>
            <div className='mt-2 text-sm text-red-700'>
              <p>{alertText}</p>
            </div>
          </div>
        </div>
      </div>
    );
  } else if (alertType == 'success') {
    return (
      <div className='rounded-md bg-green-50 p-4'>
        <div className='flex'>
          <div className='flex-shrink-0'>
            <CheckCircleIcon
              className='h-5 w-5 text-green-400'
              aria-hidden='true'
            />
          </div>
          <div className='ml-3'>
            <h3 className='text-sm font-medium text-green-800'>Success</h3>
            <div className='mt-2 text-sm text-green-700'>
              <p>{alertText}</p>
            </div>
          </div>
        </div>
      </div>
    );
  } else {
    return <div></div>;
  }
}
