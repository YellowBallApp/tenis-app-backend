import { useEffect, useState } from 'react';
import { HiX, HiSave, HiMenu } from 'react-icons/hi';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Layout from '../components/Layout';
import api from '../utils/api';

interface LeagueStanding {
  id: number;
  leagueRanking: number;
  user: {
    id: string;
    name: string;
    email: string;
  };
  league: {
    id: number;
    name: string;
    code: string;
  };
}

const LeagueStandings = () => {
  const [standings, setStandings] = useState<LeagueStanding[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLeague, setSelectedLeague] = useState<number | null>(null);
  const [leagues, setLeagues] = useState<any[]>([]);
  const [pendingChanges, setPendingChanges] = useState<Record<number, number | null>>({});
  const [saving, setSaving] = useState(false);
  
  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchLeagues();
  }, []);

  useEffect(() => {
    if (selectedLeague) {
      fetchStandings();
      setPendingChanges({}); // Lig değiştiğinde pending changes'i temizle
    } else {
      setStandings([]);
      setPendingChanges({});
    }
  }, [selectedLeague]);

  const fetchLeagues = async () => {
    try {
      const response = await api.get('/league/all');
      setLeagues(response.data.data || []);
      if (response.data.data && response.data.data.length > 0) {
        setSelectedLeague(response.data.data[0].id);
      }
    } catch (error) {
      console.error('Leagues fetch error:', error);
    }
  };

  const fetchStandings = async () => {
    if (!selectedLeague) return;
    
    try {
      setLoading(true);
      const response = await api.get(`/league/standings/league/${selectedLeague}`);
      const data = response.data.data || [];
      // Sıralamaya göre sırala
      data.sort((a: LeagueStanding, b: LeagueStanding) => a.leagueRanking - b.leagueRanking);
      setStandings(data);
      setPendingChanges({}); // Yeni veri yüklendiğinde pending changes'i temizle
    } catch (error) {
      console.error('Standings fetch error:', error);
      alert('Sıralamalar yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };


  const handleCancelAll = () => {
    setPendingChanges({});
  };

  const handleSaveAll = async () => {
    if (Object.keys(pendingChanges).length === 0) {
      alert('Kaydedilecek değişiklik bulunmamaktadır');
      return;
    }

    const updateCount = Object.values(pendingChanges).filter(v => v !== null).length;
    const deleteCount = Object.values(pendingChanges).filter(v => v === null).length;
    const totalCount = Object.keys(pendingChanges).length;
    
    let confirmMessage = `${totalCount} değişiklik kaydedilecek`;
    if (updateCount > 0 && deleteCount > 0) {
      confirmMessage = `${updateCount} sıralama güncellenecek ve ${deleteCount} oyuncu ligden çıkarılacak. Devam etmek istediğinize emin misiniz?`;
    } else if (deleteCount > 0) {
      confirmMessage = `${deleteCount} oyuncu ligden çıkarılacak. Devam etmek istediğinize emin misiniz?`;
    } else {
      confirmMessage = `${updateCount} sıralama güncellenecek. Devam etmek istediğinize emin misiniz?`;
    }

    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      setSaving(true);
      
      // Güncelleme ve silme işlemlerini ayır
      const updatePromises: Promise<any>[] = [];
      const deletePromises: Promise<any>[] = [];
      
      Object.entries(pendingChanges).forEach(([id, ranking]) => {
        if (ranking === null) {
          // Silme işlemi
          deletePromises.push(api.delete(`/league/standings/${id}`));
        } else {
          // Güncelleme işlemi
          updatePromises.push(api.put(`/league/standings/${id}`, { leagueRanking: ranking }));
        }
      });
      
      // Tüm işlemleri paralel olarak çalıştır
      await Promise.all([...updatePromises, ...deletePromises]);
      
      setPendingChanges({});
      await fetchStandings();
      alert('Tüm değişiklikler başarıyla kaydedildi');
    } catch (error: any) {
      console.error('Save all error:', error);
      alert(error.response?.data?.message || 'Değişiklikler kaydedilirken bir hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const getDisplayRanking = (standing: LeagueStanding, index: number) => {
    if (pendingChanges[standing.id] === null) {
      return ''; // Silme işlemi için boş göster
    }
    
    // Eğer pending changes'de varsa onu kullan
    if (pendingChanges[standing.id] !== undefined && pendingChanges[standing.id] !== null) {
      return pendingChanges[standing.id];
    }
    
    // Pending changes yoksa, mevcut standings'deki index'e göre hesapla
    // Ama silinmemiş oyuncuları sayarak
    let validRanking = 0;
    for (let i = 0; i <= index; i++) {
      const currentId = standings[i].id;
      // Eğer bu oyuncu silinmemişse say
      if (pendingChanges[currentId] !== null) {
        validRanking++;
      }
    }
    
    return validRanking;
  };

  const hasChanges = Object.keys(pendingChanges).length > 0;

  const handleDelete = (id: number) => {
    // Silme işlemini pending changes'e ekle
    setPendingChanges(prev => ({
      ...prev,
      [id]: null // null değeri silme işlemi olarak kullan
    }));
  };

  const isMarkedForDeletion = (id: number) => {
    return pendingChanges[id] === null;
  };

  // Drag and drop handler
  const handleDragEnd = (event: { active: { id: number }; over: { id: number } | null }) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setStandings((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        
        if (oldIndex === -1 || newIndex === -1) {
          return items; // Geçersiz indeks, değişiklik yapma
        }
        
        const newItems = arrayMove(items, oldIndex, newIndex);
        
        // Yeni sıralamaya göre ranking'leri güncelle
        // Sadece silinmemiş oyunculara 1'den başlayarak unique ranking ver
        const updatedChanges: Record<number, number> = {};
        let validRanking = 0;
        
        newItems.forEach((item) => {
          // Eğer bu oyuncu silinmemişse, ona unique ranking ver
          const isDeleted = pendingChanges[item.id] === null;
          if (!isDeleted) {
            validRanking++;
            updatedChanges[item.id] = validRanking;
          }
        });
        
        // Pending changes'e ekle (mevcut silme işlemlerini koru)
        setPendingChanges((prev) => {
          const newChanges: Record<number, number | null> = {};
          
          // Önce mevcut silme işlemlerini koru
          Object.keys(prev).forEach((idStr) => {
            const id = parseInt(idStr);
            if (prev[id] === null) {
              newChanges[id] = null; // Silme işlemlerini koru
            }
          });
          
          // Sonra yeni ranking'leri ekle (silinmemiş oyuncular için)
          Object.keys(updatedChanges).forEach((idStr) => {
            const id = parseInt(idStr);
            newChanges[id] = updatedChanges[id];
          });
          
          return newChanges;
        });
        
        return newItems;
      });
    }
  };

  if (loading && !selectedLeague) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-soft-white">Yükleniyor...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-soft-white">Lig Sıralamaları</h1>
        </div>

        {/* League Selector */}
        <div className="glass rounded-2xl p-4">
          <label className="block text-soft-white mb-2 text-sm">Lig Seçin</label>
          <select
            value={selectedLeague || ''}
            onChange={(e) => setSelectedLeague(e.target.value ? parseInt(e.target.value) : null)}
            className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-soft-white focus:outline-none focus:border-soft-green"
          >
            <option value="">Lig Seçin</option>
            {leagues.map((league) => (
              <option key={league.id} value={league.id}>
                {league.name} ({league.code})
              </option>
            ))}
          </select>
        </div>

        {selectedLeague && (
          <div className="glass rounded-2xl p-6">
            {loading ? (
              <div className="text-center py-8 text-soft-white/60">Yükleniyor...</div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left py-3 px-4 text-soft-white font-semibold">Sıra</th>
                        <th className="text-left py-3 px-4 text-soft-white font-semibold">Kullanıcı</th>
                        <th className="text-left py-3 px-4 text-soft-white font-semibold">E-posta</th>
                        <th className="text-left py-3 px-4 text-soft-white font-semibold">İşlemler</th>
                      </tr>
                    </thead>
                    <tbody>
                      {standings.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="text-center py-8 text-soft-white/60">
                            Bu ligde henüz oyuncu bulunmamaktadır
                          </td>
                        </tr>
                      ) : (
                        <DndContext
                          sensors={sensors}
                          collisionDetection={closestCenter}
                          onDragEnd={handleDragEnd}
                        >
                          <SortableContext
                            items={standings.map(s => s.id)}
                            strategy={verticalListSortingStrategy}
                          >
                            {standings.map((standing, index) => {
                              const displayRanking = getDisplayRanking(standing, index);
                              return (
                                <SortableRow
                                  key={standing.id}
                                  standing={standing}
                                  displayRanking={displayRanking}
                                  isChanged={pendingChanges[standing.id] !== undefined && pendingChanges[standing.id] !== null}
                                  isDeleted={isMarkedForDeletion(standing.id)}
                                  onDelete={handleDelete}
                                  onCancelDelete={() => {
                                    setPendingChanges(prev => {
                                      const newState = { ...prev };
                                      delete newState[standing.id];
                                      return newState;
                                    });
                                  }}
                                />
                              );
                            })}
                          </SortableContext>
                        </DndContext>
                      )}
                    </tbody>
                  </table>
                </div>
                
                {/* Save All / Cancel All Buttons */}
                {hasChanges && (
                  <div className="mt-6 flex items-center justify-end gap-4 pt-4 border-t border-white/10">
                    <div className="text-sm text-soft-white/60">
                      {Object.values(pendingChanges).filter(v => v !== null).length} sıralama güncellemesi, {' '}
                      {Object.values(pendingChanges).filter(v => v === null).length} silme işlemi bekleniyor
                    </div>
                    <button
                      onClick={handleCancelAll}
                      disabled={saving}
                      className="px-6 py-2 bg-white/10 text-soft-white rounded-xl hover:bg-white/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <HiX className="text-lg" />
                      Tümünü İptal
                    </button>
                    <button
                      onClick={handleSaveAll}
                      disabled={saving}
                      className="px-6 py-2 bg-soft-green text-soft-navy rounded-xl font-semibold hover:bg-soft-green/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {saving ? (
                        <>
                          <div className="w-4 h-4 border-2 border-soft-navy border-t-transparent rounded-full animate-spin"></div>
                          Kaydediliyor...
                        </>
                      ) : (
                        <>
                          <HiSave className="text-lg" />
                          Tümünü Kaydet
                        </>
                      )}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

// Sortable Row Component
interface SortableRowProps {
  standing: LeagueStanding;
  displayRanking: number | string;
  isChanged: boolean;
  isDeleted: boolean;
  onDelete: (id: number) => void;
  onCancelDelete: () => void;
}

const SortableRow = ({
  standing,
  displayRanking,
  isChanged,
  isDeleted,
  onDelete,
  onCancelDelete,
}: SortableRowProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: standing.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`border-b border-white/5 hover:bg-white/5 ${
        isDeleted ? 'bg-red-500/10 opacity-60' : 
        isChanged ? 'bg-yellow-500/10' : ''
      } ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
    >
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          <button
            {...attributes}
            {...listeners}
            className="p-1 text-soft-white/60 hover:text-soft-white transition-colors cursor-grab active:cursor-grabbing"
            title="Sürükle"
          >
            <HiMenu className="text-xl" />
          </button>
          <span className="w-12 px-2 py-1 bg-white/10 border border-white/20 rounded text-soft-white text-center font-semibold">
            {displayRanking}
          </span>
          {isChanged && !isDeleted && (
            <span className="text-xs text-yellow-400">*</span>
          )}
          {isDeleted && (
            <span className="text-xs text-red-400">Silinecek</span>
          )}
        </div>
      </td>
      <td className={`py-3 px-4 font-medium ${isDeleted ? 'text-soft-white/50 line-through' : 'text-soft-white'}`}>
        {standing.user.name}
      </td>
      <td className={`py-3 px-4 text-sm ${isDeleted ? 'text-soft-white/50' : 'text-soft-white/80'}`}>
        {standing.user.email}
      </td>
      <td className="py-3 px-4">
        <button
          onClick={() => {
            if (isDeleted) {
              onCancelDelete();
            } else {
              onDelete(standing.id);
            }
          }}
          className={`p-2 rounded-lg transition-all ${
            isDeleted 
              ? 'text-green-400 hover:bg-green-400/20' 
              : 'text-red-400 hover:bg-red-400/20'
          }`}
          title={isDeleted ? 'Silme İptal' : 'Çıkar'}
        >
          <HiX />
        </button>
      </td>
    </tr>
  );
};

export default LeagueStandings;

