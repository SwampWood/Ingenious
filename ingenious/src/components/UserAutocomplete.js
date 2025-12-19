import React, { useState, useEffect, useRef } from 'react';
import api from '../api';
import './UserAutocomplete.css';

const UserAutocomplete = ({ 
  selectedUsers = [], 
  onUsersChange,
  placeholder = "Начните вводить логин пользователя...",
  excludeCurrentUser = true,
  currentUserId = null
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const searchUsers = async () => {
      if (searchQuery.length < 2) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const response = await api.get(`users/users/?search=${searchQuery}`);
        const users = response.data.results || response.data;

        let filtered = users.filter(user => 
          !selectedUsers.some(selected => selected.id === user.id)
        );
        
        if (excludeCurrentUser && currentUserId) {
          filtered = filtered.filter(user => user.id !== currentUserId);
        }
        
        setSearchResults(filtered);
        setShowResults(true);
      } catch (error) {
        console.error('Ошибка поиска пользователей:', error);
      } finally {
        setIsSearching(false);
      }
    };

    const debounceTimer = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery, selectedUsers, excludeCurrentUser, currentUserId]);

  const handleAddUser = (user) => {
    if (!selectedUsers.some(u => u.id === user.id)) {
      const newUsers = [...selectedUsers, user];
      onUsersChange(newUsers);
    }
    setSearchQuery('');
    setShowResults(false);
  };

  const handleRemoveUser = (userId) => {
    const newUsers = selectedUsers.filter(user => user.id !== userId);
    onUsersChange(newUsers);
  };

  const getAvatarUrl = (avatarPath) => {
    if (!avatarPath) return null;
    if (avatarPath.startsWith('http')) return avatarPath;
    return `http://localhost:8000${avatarPath}`;
  };

  return (
    <div className="user-autocomplete" ref={containerRef}>
      <div className="autocomplete-input-container">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => searchQuery.length >= 2 && setShowResults(true)}
          placeholder={placeholder}
          className="autocomplete-input"
        />
        {isSearching && (
          <div className="search-loading">Поиск...</div>
        )}
      </div>

      {showResults && searchResults.length > 0 && (
        <div className="autocomplete-results">
          {searchResults.map(user => (
            <div
              key={user.id}
              className="result-item"
              onClick={() => handleAddUser(user)}
            >
              <div className="result-avatar">
                {user.avatar ? (
                  <img 
                    src={getAvatarUrl(user.avatar)} 
                    alt={user.username}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      const fallback = e.target.nextElementSibling;
                      if (fallback) fallback.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div className="avatar-fallback" style={{ display: user.avatar ? 'none' : 'flex' }}>
                  {user.username[0].toUpperCase()}
                </div>
              </div>
              <div className="result-info">
                <div className="result-username">{user.username}</div>
                <div className="result-email">{user.email}</div>
              </div>
              <button 
                type="button" 
                className="add-user-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddUser(user);
                }}
              >
                Добавить
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="selected-users">
        {selectedUsers.map(user => (
          <div key={user.id} className="selected-user-tag">
            <div className="user-avatar-small">
              {user.avatar ? (
                <img src={getAvatarUrl(user.avatar)} alt={user.username} />
              ) : (
                <div className="avatar-fallback-small">
                  {user.username[0].toUpperCase()}
                </div>
              )}
            </div>
            <span className="user-username">{user.username}</span>
            <button
              type="button"
              className="remove-user-btn"
              onClick={() => handleRemoveUser(user.id)}
              title="Удалить"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {showResults && searchQuery.length >= 2 && !isSearching && searchResults.length === 0 && (
        <div className="no-results">
          Пользователи не найдены
        </div>
      )}
    </div>
  );
};

export default UserAutocomplete;
