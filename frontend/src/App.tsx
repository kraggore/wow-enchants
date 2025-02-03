import { useState, useEffect, useMemo } from 'react'
import './App.css'

const API_BASE_URL = import.meta.env.VITE_API_URL;

interface Reagent {
  name: string;
  quantity: number;
  icon_url?: string;
}

interface Enchant {
  id: number;
  url: string;
  name_part1: string;
  name_part2: string;
  reagents: Reagent[];
}

interface CartItem {
  enchant: Enchant;
  quantity: number;
}

function App() {
  const [enchants, setEnchants] = useState<Enchant[]>([]);
  const [newEnchantUrl, setNewEnchantUrl] = useState('');
  const [error, setError] = useState('');
  const [expandedEnchantId, setExpandedEnchantId] = useState<number | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('cartItems');
    return saved ? JSON.parse(saved) : [];
  });
  const [totalReagents, setTotalReagents] = useState<Reagent[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');

  useEffect(() => {
    localStorage.setItem('cartItems', JSON.stringify(cartItems));
  }, [cartItems]);

  const calculateTotalReagents = async () => {
    if (cartItems.length === 0) {
      setTotalReagents([]);
      return;
    }

    try {
      // Create an array where each enchant ID appears quantity times
      const enchantIds = cartItems.flatMap(item =>
        new Array(item.quantity).fill(item.enchant.id)
      );

      const response = await fetch(`${API_BASE_URL}/calculate/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(enchantIds),
      });

      if (!response.ok) throw new Error('Failed to calculate total');
      const data = await response.json();
      setTotalReagents(data);
    } catch (err) {
      setError('Failed to calculate total reagents');
    }
  };

  useEffect(() => {
    fetchEnchants();
  }, []);

  useEffect(() => {
    if (cartItems.length > 0) {
      calculateTotalReagents();
    } else {
      setTotalReagents([]);
    }
  }, [cartItems]);

  const enchantTypes = useMemo(() => {
    const types = new Set<string>();
    enchants.forEach(enchant => {
      let type = enchant.name_part1;

      // Remove 'Enchant ' prefix if present
      if (type.startsWith('Enchant ')) {
        type = type.substring(8);
      } else if (type.endsWith('Armor Kit')) {
        type = 'Armor Kit';
      }

      types.add(type);
    });

    return Array.from(types).sort();
  }, [enchants]);

  const filteredEnchants = useMemo(() => {
    return enchants.filter(enchant => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        enchant.name_part1.toLowerCase().includes(searchLower) ||
        enchant.name_part2.toLowerCase().includes(searchLower) ||
        enchant.reagents.some(reagent =>
          reagent.name.toLowerCase().includes(searchLower)
        );

      if (!selectedType) return matchesSearch;

      let enchantType = enchant.name_part1;
      if (enchantType.startsWith('Enchant ')) {
        enchantType = enchantType.substring(8);
      } else if (enchantType.endsWith('Armor Kit')) {
        enchantType = 'Armor Kit';
      }

      return matchesSearch && enchantType === selectedType;
    });
  }, [enchants, searchTerm, selectedType]);

  const fetchEnchants = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/enchants/`);
      if (!response.ok) throw new Error('Failed to fetch enchants');
      const data = await response.json();
      setEnchants(data);
    } catch (err) {
      setError('Failed to load enchants');
    }
  };

  const addEnchant = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE_URL}/enchants/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: newEnchantUrl }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.detail || 'Failed to add enchant');
      } else {
        await fetchEnchants();
        setNewEnchantUrl('');
        setError('');
      }
    } catch (err) {
      setError('Failed to add enchant');
    }
  };

  const deleteEnchant = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const response = await fetch(`${API_BASE_URL}/enchants/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.detail || 'Failed to delete enchant');
      } else {
        await fetchEnchants();
        if (expandedEnchantId === id) {
          setExpandedEnchantId(null);
        }
        setCartItems(prev => prev.filter(e => e.enchant.id !== id));
        setError('');
      }
    } catch (err) {
      setError('Failed to delete enchant');
    }
  };

  const toggleEnchant = (id: number) => {
    setExpandedEnchantId(expandedEnchantId === id ? null : id);
  };

  const addToCart = (enchant: Enchant, e: React.MouseEvent) => {
    e.stopPropagation();
    setCartItems(prev => {
      const existingItem = prev.find(item => item.enchant.id === enchant.id);
      if (existingItem) {
        return prev.map(item =>
          item.enchant.id === enchant.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { enchant, quantity: 1 }];
    });
  };

  const removeFromCart = (enchantId: number) => {
    setCartItems(prev => prev.filter(item => item.enchant.id !== enchantId));
  };

  const updateCartItemQuantity = (enchantId: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    setCartItems(prev => {
      const newItems = prev.map(item =>
        item.enchant.id === enchantId
          ? { ...item, quantity: newQuantity }
          : item
      );
      return newItems;
    });
  };

  return (
    <div className="app-layout">
      <div className="main-content">
        <div className="content-wrapper">
          <form onSubmit={addEnchant} className="add-enchant-form">
            <input
              type="text"
              value={newEnchantUrl}
              onChange={(e) => setNewEnchantUrl(e.target.value)}
              placeholder="Enter Wowhead enchant URL"
              className="url-input"
            />
            <button type="submit" className="add-button">Add Enchant</button>
          </form>

          <h1>WoW Enchants Calculator</h1>

          {error && <div className="error">{error}</div>}

          <div className="search-container">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search enchants or reagents..."
              className="search-input"
            />
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="type-select"
            >
              <option value="">All Types</option>
              {enchantTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div className="list-separator"></div>

          <div className="enchants-list">
            {filteredEnchants.map(enchant => (
              <div
                key={enchant.id}
                className="enchant-item"
                onClick={() => toggleEnchant(enchant.id)}
              >
                <div className="enchant-header">
                  <h3>{enchant.name_part1} {enchant.name_part2}</h3>
                  <div className="enchant-actions">
                    <button
                      className="use-button"
                      onClick={(e) => addToCart(enchant, e)}
                      disabled={cartItems.some(e => e.enchant.id === enchant.id)}
                    >
                      {cartItems.some(e => e.enchant.id === enchant.id) ? 'Added' : 'Use'}
                    </button>
                    <button
                      className="delete-button"
                      onClick={(e) => deleteEnchant(enchant.id, e)}
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {expandedEnchantId === enchant.id && (
                  <div className="reagents">
                    {enchant.reagents.map((reagent, index) => (
                      <div key={index} className="reagent">
                        {reagent.icon_url && <img src={reagent.icon_url} alt={reagent.name} className="reagent-icon" />}
                        <span>{reagent.name} x{reagent.quantity}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="cart-sidebar">
        <div className="cart-header">
          <h2>Selected Enchants</h2>
          {cartItems.length > 0 && (
            <button onClick={() => setCartItems([])} className="clear-cart">
              Clear All
            </button>
          )}
        </div>

        {cartItems.length === 0 ? (
          <div className="cart-empty">No enchants selected</div>
        ) : (
          <>
            <div className="cart-items">
              {cartItems.map(item => (
                <div key={item.enchant.id} className="cart-item">
                  <div className="cart-item-info">
                    <span className="quantity-controls">
                      <span className="quantity">{item.quantity} x</span>
                    </span>
                    <span className="cart-item-name">
                      {item.enchant.name_part1} {item.enchant.name_part2}
                    </span>
                  </div>
                  <button
                    className="quantity-button"
                    onClick={() => updateCartItemQuantity(item.enchant.id, item.quantity + 1)}
                  >
                    +
                  </button>
                  <button
                    className="quantity-button"
                    onClick={() => updateCartItemQuantity(item.enchant.id, item.quantity - 1)}
                  >
                    -
                  </button>
                  <button
                    onClick={() => removeFromCart(item.enchant.id)}
                    className="remove-from-cart"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            {totalReagents.length > 0 && (
              <div className="total-reagents">
                <h3>Total Reagents Needed:</h3>
                {totalReagents.map((reagent, index) => (
                  <div key={index} className="reagent">
                    {reagent.icon_url && (
                      <img src={reagent.icon_url} alt={reagent.name} className="reagent-icon" />
                    )}
                    <span>{reagent.name} x{reagent.quantity}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default App
