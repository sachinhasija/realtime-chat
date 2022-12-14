import React, { useState, useEffect, useRef } from 'react';
import classNames from 'classnames';
import searchIcon from '../../assets/images/ic_search.svg';
import scss from './searchbar.module.scss';

interface Props {
  className?: string;
  placeholder?: string;
  onChange?: any;
  searchValueMain?: string;
  setMainSearch?: (search: string) => null;
}

const SearchBar = (props: Props) => {
  const {
    className, placeholder, onChange, searchValueMain, setMainSearch,
  } = props;
  // const inputClass = classNames(css.input_search, className);
  const searched = null;
  const [searchValue, setSearchValue] = useState(searched ?? '');
  const [showSearch, setShowSearch] = useState(false);
  const onFocusContainer = (e: any) => {
    setShowSearch(true);
  };
  const wrapperRef = useRef(null);

  useEffect(() => {
    setSearchValue(searched || '');
  }, [searched]);

  return (
    <div
      className={classNames('form_field', className, showSearch ? `input_search_focussed ${scss.search_focused}` : '')}
      // id="recent_search_suggestion"
      onFocus={onFocusContainer}
      ref={wrapperRef}
    >
      <div className={`text_field ${scss.search_wrap} ${scss.header_search_wrap}`}>
        <input
          type="search"
          className={`search_input ${scss.search_input}`}
          placeholder={placeholder}
          value={(searchValueMain === '' || searchValueMain) ? searchValueMain : searchValue || ''}
          onKeyDown={(e) => {
            if (e.key === '^' || e.key === '%') {
              e.preventDefault();
            }
          }}
          onChange={(e: any) => {
            if (e.target.value.includes('^') || e.target.value.includes('%')) {
              e.preventDefault();
              return;
            }
            if (onChange) {
              onChange(e.target.value);
            }
            if (setMainSearch) {
              setMainSearch(e.target.value);
            } else {
              setSearchValue(e.target.value);
            }
          }}
        />
        <span className={`${scss.icon} ${scss.search_icon}`}>
          <img src={searchIcon} alt="search" />
        </span>
      </div>
    </div>
  );
};

SearchBar.defaultProps = {
  searchValueMain: undefined,
};

export default SearchBar;
