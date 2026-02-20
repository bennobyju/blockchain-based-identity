"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { uploadFileToIPFS, uploadJSONToIPFS } from '@/utils/ipfs';
import { createIdentity } from '@/utils/blockchain';

const ID_TYPES = [
  { value: 'national_id', label: 'National ID' },
  { value: 'driver_license', label: 'Driver License' },
  { value: 'passport', label: 'Passport' },
  { value: 'student_id', label: 'Student ID' },
  { value: 'employee_id', label: 'Employee ID' },
];

export default function CreateIDForm({ onSuccess }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [error, setError] = useState(null);
  
  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm({
    defaultValues: {
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      idType: 'national_id',
      expiryDuration: '31536000', // 1 year in seconds
      additionalInfo: '',
    }
  });

  // Watch for photo file changes to show preview
  const photoFile = watch('photo');
  
  // Handle photo change to create preview URL
  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setPhotoPreview(null);
    }
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Upload photo to IPFS if provided
      let photoUrl = null;
      if (data.photo && data.photo.length > 0) {
        const photoIpfsHash = await uploadFileToIPFS(data.photo[0]);
        photoUrl = `https://ipfs.io/ipfs/${photoIpfsHash}`;
      }
      
      // Create metadata for IPFS
      const metadata = {
        firstName: data.firstName,
        lastName: data.lastName,
        dateOfBirth: data.dateOfBirth,
        photoUrl,
        additionalInfo: data.additionalInfo,
        createdAt: new Date().toISOString(),
      };
      
      // Upload metadata to IPFS
      const metadataIpfsHash = await uploadJSONToIPFS(metadata);
      
      // Convert expiry duration to seconds
      const expiryDuration = parseInt(data.expiryDuration);
      
      // Create identity on blockchain
      const idNumber = await createIdentity(
        metadataIpfsHash,
        expiryDuration,
        data.idType
      );
      
      console.log('Identity created with ID:', idNumber);
      
      // Reset form and notify parent
      reset();
      setPhotoPreview(null);
      if (onSuccess) {
        onSuccess(idNumber);
      }
    } catch (err) {
      console.error('Error creating ID:', err);
      setError(err.message || 'Failed to create ID. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="card">
      <h2 className="text-xl font-bold mb-6">Create New Digital ID</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-900/20 border border-red-800 rounded-md">
          <p className="text-red-400">{error}</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* First Name */}
          <div>
            <label className="block text-sm font-medium mb-1">First Name</label>
            <input
              type="text"
              className="input w-full"
              {...register('firstName', { required: 'First name is required' })}
            />
            {errors.firstName && (
              <p className="mt-1 text-sm text-red-500">{errors.firstName.message}</p>
            )}
          </div>
          
          {/* Last Name */}
          <div>
            <label className="block text-sm font-medium mb-1">Last Name</label>
            <input
              type="text"
              className="input w-full"
              {...register('lastName', { required: 'Last name is required' })}
            />
            {errors.lastName && (
              <p className="mt-1 text-sm text-red-500">{errors.lastName.message}</p>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Date of Birth */}
          <div>
            <label className="block text-sm font-medium mb-1">Date of Birth</label>
            <input
              type="date"
              className="input w-full"
              {...register('dateOfBirth', { required: 'Date of birth is required' })}
            />
            {errors.dateOfBirth && (
              <p className="mt-1 text-sm text-red-500">{errors.dateOfBirth.message}</p>
            )}
          </div>
          
          {/* ID Type */}
          <div>
            <label className="block text-sm font-medium mb-1">ID Type</label>
            <select
              className="input w-full"
              {...register('idType')}
            >
              {ID_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        {/* Expiry Duration */}
        <div>
          <label className="block text-sm font-medium mb-1">Expiry Duration</label>
          <select
            className="input w-full"
            {...register('expiryDuration')}
          >
            <option value="31536000">1 Year</option>
            <option value="63072000">2 Years</option>
            <option value="157680000">5 Years</option>
            <option value="315360000">10 Years</option>
            <option value="0">No Expiry</option>
          </select>
        </div>
        
        {/* Photo Upload */}
        <div>
          <label className="block text-sm font-medium mb-1">Photo (Optional)</label>
          <div className="flex items-start space-x-4">
            <div className="flex-1">
              <input
                type="file"
                accept="image/*"
                className="input w-full p-2"
                {...register('photo')}
                onChange={handlePhotoChange}
              />
            </div>
            
            {photoPreview && (
              <div className="w-24 h-32 bg-[var(--card)] border border-[var(--border)] rounded-md overflow-hidden">
                <img 
                  src={photoPreview} 
                  alt="Preview" 
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>
        </div>
        
        {/* Additional Info */}
        <div>
          <label className="block text-sm font-medium mb-1">Additional Info (Optional)</label>
          <textarea
            className="input w-full min-h-[100px]"
            {...register('additionalInfo')}
          ></textarea>
        </div>
        
        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary min-w-[150px]"
          >
            {isSubmitting ? 'Creating...' : 'Create ID'}
          </button>
        </div>
      </form>
    </div>
  );
} 