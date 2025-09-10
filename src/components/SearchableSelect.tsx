import React from 'react';
import AsyncSelect from 'react-select/async';
import { supabase } from '../lib/supabase';
import { StylesConfig } from 'react-select';

interface SearchableSelectProps {
  value: any;
  onChange: (value: any) => void;
  placeholder: string;
  tableName: 'books' | 'members';
  labelField: string;
  searchFields: string[];
  required?: boolean;
}

const selectStyles: StylesConfig = {
  control: (base, state) => ({
    ...base,
    minHeight: '42px',
    borderColor: state.isFocused ? '#818CF8' : '#D1D5DB',
    boxShadow: state.isFocused ? '0 0 0 2px #C7D2FE' : 'none',
    '&:hover': { borderColor: '#A5B4FC' },
    borderRadius: '0.5rem',
  }),
  option: (base, { isFocused, isSelected }) => ({
    ...base,
    backgroundColor: isSelected ? '#6366F1' : isFocused ? '#EEF2FF' : undefined,
    color: isSelected ? 'white' : 'black',
    '&:active': {
      backgroundColor: isSelected ? '#4F46E5' : '#E0E7FF',
    },
  }),
  placeholder: (base) => ({
    ...base,
    color: '#9CA3AF',
  }),
};

const SearchableSelect: React.FC<SearchableSelectProps> = ({
  value,
  onChange,
  placeholder,
  tableName,
  labelField,
  searchFields,
  required
}) => {
  const loadOptions = async (inputValue: string) => {
    try {
      let query = supabase.from(tableName).select(`id, ${labelField}, ${searchFields.join(', ')}`);
      
      if (inputValue) {
        const searchFilters = searchFields.map(field => `${field}.ilike.%${inputValue}%`).join(',');
        query = query.or(searchFilters);
      }

      const { data, error } = await query.limit(20);

      if (error) {
        console.error(`Error fetching ${tableName}:`, error);
        return [];
      }

      return data.map(item => ({
        value: item.id,
        label: item[labelField],
        data: item
      }));
    } catch (error) {
      return [];
    }
  };

  return (
    <AsyncSelect
      cacheOptions
      defaultOptions
      value={value}
      onChange={onChange}
      loadOptions={loadOptions}
      isClearable
      placeholder={placeholder}
      required={required}
      noOptionsMessage={({ inputValue }) => 
        !inputValue ? 'Start typing to search...' : 'No results found'
      }
      loadingMessage={() => 'Loading...'}
      styles={selectStyles}
    />
  );
};

export default SearchableSelect;
