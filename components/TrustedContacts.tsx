
import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  Phone, 
  Mail, 
  MapPin, 
  Edit2, 
  Trash2, 
  User, 
  Briefcase, 
  X,
  Save,
  Filter,
  Users
} from 'lucide-react';
import { Contact } from '../types';

const PROFESSIONS = [
  "Solicitor",
  "Auctioneer/Estate Agent",
  "Mortgage Broker",
  "Surveyor/Engineer",
  "Architect",
  "Plumber",
  "Electrician",
  "Carpenter",
  "Roofer",
  "Handyman",
  "General Contractor",
  "Gardener/Landscaper",
  "Painter/Decorator",
  "Cleaner",
  "Removals",
  "Interior Designer",
  "Property Manager",
  "Accountant",
  "Other"
];

const TrustedContacts: React.FC = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'newest'>('name');

  // Form State
  const [formData, setFormData] = useState<Omit<Contact, 'id' | 'createdAt'>>({
    firstName: '',
    surname: '',
    profession: '',
    email: '',
    phone: '',
    address: '',
    eircode: '',
    notes: ''
  });
  const [error, setError] = useState<string | null>(null);

  // Load contacts
  useEffect(() => {
    const saved = localStorage.getItem('eirestate_contacts');
    if (saved) {
      try {
        setContacts(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse contacts");
      }
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError(null);
  };

  const handleOpenModal = (contact?: Contact) => {
    if (contact) {
      setEditingId(contact.id);
      setFormData({
        firstName: contact.firstName,
        surname: contact.surname,
        profession: contact.profession,
        email: contact.email,
        phone: contact.phone,
        address: contact.address,
        eircode: contact.eircode,
        notes: contact.notes
      });
    } else {
      setEditingId(null);
      setFormData({
        firstName: '',
        surname: '',
        profession: '',
        email: '',
        phone: '',
        address: '',
        eircode: '',
        notes: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setError(null);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Minimal Validation
    if (!formData.firstName.trim() && !formData.surname.trim()) {
      setError("Please enter at least a First Name or Surname.");
      return;
    }

    let updatedContacts = [...contacts];

    if (editingId) {
      // Edit
      updatedContacts = updatedContacts.map(c => 
        c.id === editingId 
          ? { ...c, ...formData } 
          : c
      );
    } else {
      // Add
      const newContact: Contact = {
        id: crypto.randomUUID(),
        createdAt: Date.now(),
        ...formData
      };
      updatedContacts.push(newContact);
    }

    setContacts(updatedContacts);
    localStorage.setItem('eirestate_contacts', JSON.stringify(updatedContacts));
    handleCloseModal();
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this contact?")) {
      const updated = contacts.filter(c => c.id !== id);
      setContacts(updated);
      localStorage.setItem('eirestate_contacts', JSON.stringify(updated));
    }
  };

  const filteredContacts = contacts
    .filter(c => {
      const searchLower = searchTerm.toLowerCase();
      const fullName = `${c.firstName} ${c.surname}`.toLowerCase();
      const prof = c.profession.toLowerCase();
      return fullName.includes(searchLower) || prof.includes(searchLower);
    })
    .sort((a, b) => {
      if (sortBy === 'newest') return b.createdAt - a.createdAt;
      const nameA = `${a.firstName} ${a.surname}`.toLowerCase();
      const nameB = `${b.firstName} ${b.surname}`.toLowerCase();
      return nameA.localeCompare(nameB);
    });

  const getInitials = (first: string, last: string) => {
    const f = first ? first[0] : '';
    const l = last ? last[0] : '';
    return (f + l).toUpperCase() || '?';
  };

  return (
    <div className="max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Trusted Contacts</h1>
          <p className="text-slate-500 mt-2">Manage your network of solicitors, tradespeople, and agents.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-sm transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Contact
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 sticky top-0 z-10">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-emerald-600" />
            <input 
              type="text" 
              placeholder="Search by name or profession..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm font-bold text-emerald-700 bg-emerald-50 placeholder-slate-400"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 focus:ring-2 focus:ring-emerald-500 bg-white"
            >
              <option value="name">Sort: A-Z</option>
              <option value="newest">Sort: Newest</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid */}
      {filteredContacts.length === 0 ? (
        <div className="text-center py-20 bg-slate-50 rounded-xl border border-dashed border-slate-300">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white shadow-sm mb-4">
            <Users className="w-8 h-8 text-slate-300" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">No contacts found</h3>
          <p className="text-slate-500 text-sm mt-1 mb-6">Start building your little black book of property contacts.</p>
          <button 
            onClick={() => handleOpenModal()}
            className="text-emerald-600 font-bold hover:underline"
          >
            Add your first contact
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredContacts.map(contact => (
            <div key={contact.id} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col group relative">
              
              {/* Card Actions */}
              <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => handleOpenModal(contact)}
                  className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => handleDelete(contact.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Header */}
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-lg shrink-0">
                  {getInitials(contact.firstName, contact.surname)}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 line-clamp-1" title={`${contact.firstName} ${contact.surname}`}>
                    {contact.firstName} {contact.surname}
                  </h3>
                  {contact.profession && (
                    <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-600 mt-1">
                      {contact.profession}
                    </span>
                  )}
                </div>
              </div>

              {/* Details */}
              <div className="space-y-3 mt-2 flex-1">
                {contact.phone && (
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <Phone className="w-4 h-4 text-emerald-500 shrink-0" />
                    <a href={`tel:${contact.phone}`} className="hover:text-emerald-700 hover:underline">{contact.phone}</a>
                  </div>
                )}
                {contact.email && (
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <Mail className="w-4 h-4 text-emerald-500 shrink-0" />
                    <a href={`mailto:${contact.email}`} className="hover:text-emerald-700 hover:underline truncate">{contact.email}</a>
                  </div>
                )}
                {(contact.address || contact.eircode) && (
                  <div className="flex items-start gap-3 text-sm text-slate-600">
                    <MapPin className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      {contact.address && <p className="line-clamp-2">{contact.address}</p>}
                      {contact.eircode && <p className="font-mono text-xs text-slate-500 mt-0.5">{contact.eircode}</p>}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">
                {editingId ? 'Edit Contact' : 'Add New Contact'}
              </h2>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-50 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              <form id="contactForm" onSubmit={handleSave} className="space-y-5">
                
                {/* Name */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">First Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-2.5 h-4 w-4 text-emerald-600" />
                      <input 
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm font-bold text-emerald-700 bg-emerald-50 placeholder-slate-400"
                        placeholder="Jane"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Surname</label>
                    <input 
                      name="surname"
                      value={formData.surname}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm font-bold text-emerald-700 bg-emerald-50 placeholder-slate-400"
                      placeholder="Doe"
                    />
                  </div>
                </div>

                {/* Profession */}
                <div>
                   <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Profession</label>
                   <div className="relative">
                      <Briefcase className="absolute left-3 top-2.5 h-4 w-4 text-emerald-600" />
                      <select 
                        name="profession"
                        value={formData.profession}
                        onChange={handleInputChange}
                        className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm font-bold text-emerald-700 bg-emerald-50 appearance-none"
                      >
                        <option value="">Select Profession...</option>
                        {PROFESSIONS.map(p => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                   </div>
                </div>

                {/* Contact Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-2.5 h-4 w-4 text-emerald-600" />
                        <input 
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm font-bold text-emerald-700 bg-emerald-50 placeholder-slate-400"
                          placeholder="jane@example.com"
                        />
                      </div>
                   </div>
                   <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Phone</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-2.5 h-4 w-4 text-emerald-600" />
                        <input 
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm font-bold text-emerald-700 bg-emerald-50 placeholder-slate-400"
                          placeholder="087 123 4567"
                        />
                      </div>
                   </div>
                </div>

                {/* Address - Stacks on mobile, inline on desktop */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Address</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-emerald-600" />
                      <input 
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm font-bold text-emerald-700 bg-emerald-50 placeholder-slate-400"
                        placeholder="123 Main St, Dublin"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Eircode</label>
                    <input 
                      name="eircode"
                      value={formData.eircode}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm font-bold text-emerald-700 bg-emerald-50 placeholder-slate-400 uppercase placeholder:normal-case"
                      placeholder="D01 AB23"
                      maxLength={8}
                    />
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 text-sm rounded-lg">
                    {error}
                  </div>
                )}

              </form>
            </div>

            <div className="p-6 border-t border-slate-50 bg-slate-50/50 flex gap-3">
              <button 
                type="button" 
                onClick={handleCloseModal}
                className="flex-1 py-2.5 border border-slate-300 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                form="contactForm"
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-sm transition-colors flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                Save Contact
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default TrustedContacts;
