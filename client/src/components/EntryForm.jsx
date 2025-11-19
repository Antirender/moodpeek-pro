import React, { useEffect, useRef, useState } from 'react';
import { entriesApi } from '../api/entries';
import TagInput from './TagInput';
import { useAuth } from '../context/AuthContext';

// Main Entry Form Component
// AI Assistance: Content and explanations were generated/refined with ChatGPT (OpenAI, 2025)
// Reference: https://chatgpt.com/share/68fb7b6c-bc20-800c-af73-9729ade1663c
// Add/remove/refine more details by myself
function EntryForm({ onSuccess, initialEntry, isEditing = false, initialDate }) {
  const today = new Date().toLocaleDateString('en-CA');
  const { user } = useAuth();
  const cityTouchedRef = useRef(false);
  const dateTouchedRef = useRef(false);
  
  // Form state
  const [date, setDate] = useState(initialEntry?.date || initialDate || today);
  const [mood, setMood] = useState(initialEntry?.mood || '');
  const [city, setCity] = useState(initialEntry?.city || '');
  const [tags, setTags] = useState(initialEntry?.tags || []);
  const [note, setNote] = useState(initialEntry?.note || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const cityOptions = ['Toronto', 'Vancouver', 'Montreal', 'London', 'New York'];
  const moodOptions = ['happy', 'calm', 'neutral', 'sad', 'stressed'];

  useEffect(() => {
    if (isEditing) return;
    const defaultCity = user?.preferences?.defaultCity?.trim();
    if (!defaultCity || city || cityTouchedRef.current) return;
    setCity(defaultCity);
  }, [user?.preferences?.defaultCity, isEditing, city]);

  useEffect(() => {
    if (isEditing || initialEntry?.date) return;
    if (!initialDate || dateTouchedRef.current) return;
    setDate(initialDate);
    dateTouchedRef.current = true;
  }, [initialDate, isEditing, initialEntry?.date]);

  const handleCityChange = (value) => {
    cityTouchedRef.current = true;
    setCity(value);
  };

  const handleDateChange = (value) => {
    dateTouchedRef.current = true;
    setDate(value);
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validate required fields
    if (!date || !mood) {
      setError('Date and mood are required');
      return;
    }
    
    const entryData = {
      date,
      mood,
      city: city || undefined,
      tags,
      note: note || undefined,
    };
    
    setIsSubmitting(true);
    
    try {
      if (isEditing && initialEntry?._id) {
        await entriesApi.update(initialEntry._id, entryData);
      } else {
        await entriesApi.create(entryData);
      }
      
      // Reset form after successful submission (if not editing)
      if (!isEditing) {
        setDate(today);
        setMood('');
        cityTouchedRef.current = false;
        setCity('');
        setTags([]);
        setNote('');
      }
      
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error('Failed to save entry', err);
      const status = err?.response?.status ?? err?.status;
      if (status === 409) {
        setError('You already have an entry for this date. Edit the existing entry on the right instead of creating a new one.');
      } else {
        setError('Something went wrong while saving your entry. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const getMoodEmoji = (moodValue) => {
    switch (moodValue) {
      case 'happy': return '😄';
      case 'calm': return '😌';
      case 'neutral': return '😐';
      case 'sad': return '😔';
      case 'stressed': return '😫';
      default: return '';
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <article className="error-message" role="alert" aria-live="assertive">
          {error}
        </article>
      )}
      
      <div className="grid">
        {/* Date */}
        <label htmlFor="entry-date">
          Date
          <input
            type="date"
            id="entry-date"
            name="entry-date"
            value={date}
            onChange={(e) => handleDateChange(e.target.value)}
            required
          />
        </label>
        
        {/* City */}
        <label htmlFor="entry-city">
          City
          <input
            type="text"
            id="entry-city"
            name="entry-city"
            value={city}
            onChange={(e) => handleCityChange(e.target.value)}
            list="city-options"
            placeholder="Enter your city"
          />
          <datalist id="city-options">
            {cityOptions.map((city) => (
              <option key={city} value={city} />
            ))}
          </datalist>
        </label>
      </div>
      
      {/* Mood */}
      <fieldset>
        <legend>How are you feeling today?</legend>
        {moodOptions.map((moodOption) => (
          <label key={moodOption} htmlFor={`mood-${moodOption}`}>
            <input
              type="radio"
              id={`mood-${moodOption}`}
              name="mood"
              value={moodOption}
              checked={mood === moodOption}
              onChange={() => setMood(moodOption)}
              required
            />
            <span>{getMoodEmoji(moodOption)} {moodOption}</span>
          </label>
        ))}
      </fieldset>
      
      {/* Tags */}
      <label htmlFor="entry-tags">
        Tags <span className="tag-instruction">(press Enter or comma to add)</span>
      </label>
      <TagInput 
        value={tags} 
        onChange={setTags} 
        maxTags={12} 
        placeholder="Add tags..." 
        pattern={/^[a-z0-9-_]{1,24}$/i}
        id="entry-tags"
      />
      
      {/* Note */}
      <label htmlFor="entry-note">
        Note
        <textarea
          id="entry-note"
          name="entry-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          placeholder="Add any notes about your day..."
        ></textarea>
      </label>
      
      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting}
        aria-busy={isSubmitting}
      >
        {isSubmitting 
          ? 'Saving...' 
          : isEditing 
            ? 'Update Entry' 
            : 'Save Entry'
        }
      </button>
    </form>
  );
}

export default EntryForm;