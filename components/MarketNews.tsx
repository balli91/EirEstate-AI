import React, { useState } from 'react';
import { 
  X, 
  Calendar, 
  Clock, 
  ArrowRight, 
  TrendingUp, 
  Building2, 
  Landmark, 
  MapPin,
  Newspaper,
  Share2,
  Bookmark
} from 'lucide-react';

interface Article {
  id: string;
  title: string;
  summary: string;
  content: React.ReactNode;
  image: string;
  date: string;
  source: string;
  category: string;
  readTime: string;
  author: string;
}

const MOCK_ARTICLES: Article[] = [
  {
    id: '1',
    title: "House prices nationally rise by 6.5% in Q1 2024",
    summary: "The latest report shows continued growth in property values across Ireland, driven by supply shortages in key urban centers.",
    date: "14 Mar 2024",
    source: "Property Weekly",
    category: "Market Trends",
    readTime: "4 min read",
    author: "Sarah O'Connell",
    image: "https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?auto=format&fit=crop&q=80&w=1000",
    content: (
      <div className="space-y-6 text-slate-700 leading-relaxed">
        <p className="text-lg font-medium text-slate-900">National housing prices have risen by an average of 6.5% year-on-year, according to the latest figures released this morning. The increase is particularly pronounced in the West and Border regions, which are catching up to the slower growth rates seen in Dublin.</p>
        
        <h4 className="text-xl font-bold text-slate-900 mt-6 mb-2">Supply Constraints Continue</h4>
        <p>The main driver remains a critical lack of supply. With only 11,000 properties listed for sale nationally on March 1st, stock levels are at historic lows. This scarcity is forcing competitive bidding wars, pushing prices well above asking in 60% of transactions.</p>
        <p>Economists warn that without a significant ramp-up in new builds, double-digit inflation could return by year-end. "We need to see completions hit 40,000 units per annum immediately to stabilize the market," said chief economist Sarah O'Connell.</p>
        
        <div className="bg-slate-50 border-l-4 border-emerald-500 p-5 my-6 rounded-r-lg">
           <h5 className="font-bold text-emerald-800 mb-2">Regional Breakdown (YoY Growth)</h5>
           <ul className="space-y-2">
               <li className="flex justify-between border-b border-slate-200 pb-1"><span>Dublin</span> <span className="font-bold text-slate-900">+4.2%</span></li>
               <li className="flex justify-between border-b border-slate-200 pb-1"><span>Cork City</span> <span className="font-bold text-slate-900">+7.1%</span></li>
               <li className="flex justify-between border-b border-slate-200 pb-1"><span>Galway City</span> <span className="font-bold text-slate-900">+8.5%</span></li>
               <li className="flex justify-between border-b border-slate-200 pb-1"><span>Limerick City</span> <span className="font-bold text-slate-900">+9.2%</span></li>
           </ul>
        </div>

        <h4 className="text-xl font-bold text-slate-900 mt-6 mb-2">Outlook for 2024</h4>
        <p>Looking ahead, the Banking & Payments Federation Ireland (BPFI) indicates that mortgage approval activity remains robust, particularly among First Time Buyers. However, rising interest rates from the ECB may begin to dampen demand in the latter half of the year.</p>
      </div>
    )
  },
  {
    id: '2',
    title: "Central Bank flags concern over 'Buy-to-Let' exodus",
    summary: "Small landlords are leaving the market in record numbers, putting further pressure on the already strained rental sector.",
    date: "12 Mar 2024",
    source: "Irish Financial News",
    category: "Regulation",
    readTime: "6 min read",
    author: "Cormac Byrne",
    image: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=1000",
    content: (
        <div className="space-y-6 text-slate-700 leading-relaxed">
          <p className="text-lg">The Central Bank has issued a warning regarding the shrinking private rental sector. New data suggests that for every one landlord entering the market, two are exiting, citing high taxation and complex regulatory compliance as key deterrents.</p>
          
          <p>"The exodus of small-scale landlords is counterproductive to our housing goals," the report states. "Institutional investors are filling some gaps, but they are geographically concentrated in Dublin, leaving regional towns with critically low rental availability."</p>
          
          <div className="bg-slate-50 p-6 my-4 rounded-xl text-center">
              <p className="italic text-xl text-slate-600 font-serif">"We effectively have zero rental stock in towns like Tralee, Sligo, and Kilkenny. It is a crisis situation for workers trying to relocate."</p>
              <p className="mt-2 text-sm font-bold text-slate-900">- IPOA Representative</p>
          </div>
          
          <p>Government officials have hinted at potential tax breaks in the upcoming budget to encourage landlords to retain their properties, specifically targeting those who offer long-term leases of 5 years or more. However, opposition parties argue that this would merely subsidize investment without guaranteeing affordability.</p>
        </div>
    )
  },
  {
    id: '3',
    title: "Dublin 8 named one of the 'Coolest Neighborhoods' in Europe",
    summary: "The historic district has seen a surge in regeneration, attracting young professionals and investors alike.",
    date: "10 Mar 2024",
    source: "City Life Magazine",
    category: "Lifestyle",
    readTime: "3 min read",
    author: "Emma Walsh",
    image: "https://images.unsplash.com/photo-1549918864-48ac978761a4?auto=format&fit=crop&q=80&w=1000",
    content: (
        <div className="space-y-6 text-slate-700 leading-relaxed">
            <p className="text-lg">Once an overlooked industrial area, Dublin 8 has been crowned one of Europe's most vibrant neighborhoods by City Life Magazine. Citing its mix of historic distilleries, artisan cafes, and proximity to the city center, the area has become a magnet for tech workers.</p>
            
            <h4 className="text-xl font-bold text-slate-900 mt-4 mb-2">The 'Hipster' Effect on Prices</h4>
            <p>This cultural shift is reflected in property prices. Two-bedroom redbrick terraces in The Liberties and Rialto have jumped 15% in value over the last 18 months. The area offers a unique blend of "Old Dublin" charm with modern amenities that appeal heavily to the DINK (Double Income, No Kids) demographic.</p>
            
            <img 
                src="https://images.unsplash.com/photo-1629147596884-a15d5f573215?auto=format&fit=crop&q=80&w=1000" 
                alt="Dublin street" 
                className="w-full h-64 object-cover rounded-xl my-4"
            />

            <p>However, long-standing residents express concern over gentrification. "The community spirit is strong, but we must ensure families aren't priced out of their own heritage," says local councillor Pat Murphy. Plans are in motion to ensure a percentage of new developments are ring-fenced for affordable housing.</p>
        </div>
    )
  },
  {
    id: '4',
    title: "New 'First Home' Scheme cap raised to €475k",
    summary: "First-time buyers get a boost as the government adjusts ceilings for the shared equity scheme to reflect market realities.",
    date: "08 Mar 2024",
    source: "Gov Update",
    category: "Policy",
    readTime: "2 min read",
    author: "Political Staff",
    image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80&w=1000",
    content: (
        <div className="space-y-6 text-slate-700 leading-relaxed">
            <p className="text-lg">The Minister for Housing confirmed today that price ceilings for the 'First Home' shared equity scheme have been adjusted upwards. In the Greater Dublin Area, the cap is now €475,000, up from €450,000.</p>
            
            <p>The scheme allows the state to take an equity stake of up to 30% in a new build home to bridge the gap between a buyer's deposit/mortgage and the purchase price.</p>
            
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-5 my-4">
                <h4 className="font-bold text-emerald-900 mb-3 flex items-center gap-2">
                    <Building2 className="w-5 h-5" /> New Price Ceilings
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <div className="bg-white p-3 rounded-lg shadow-sm">
                         <span className="block text-xs text-slate-500 uppercase">Dublin & Wicklow</span>
                         <span className="block font-bold text-slate-900 text-lg">€475,000</span>
                     </div>
                     <div className="bg-white p-3 rounded-lg shadow-sm">
                         <span className="block text-xs text-slate-500 uppercase">Cork & Galway Cities</span>
                         <span className="block font-bold text-slate-900 text-lg">€425,000</span>
                     </div>
                     <div className="bg-white p-3 rounded-lg shadow-sm">
                         <span className="block text-xs text-slate-500 uppercase">Limerick & Waterford</span>
                         <span className="block font-bold text-slate-900 text-lg">€375,000</span>
                     </div>
                     <div className="bg-white p-3 rounded-lg shadow-sm">
                         <span className="block text-xs text-slate-500 uppercase">Rest of Country</span>
                         <span className="block font-bold text-slate-900 text-lg">€325,000</span>
                     </div>
                </div>
            </div>

            <p>Critics argue the move may simply fuel further house price inflation, while supporters say it is a necessary adjustment to help buyers access the market immediately.</p>
        </div>
    )
  },
  {
    id: '5',
    title: "Planning permission approvals reach 5-year high",
    summary: "An Bord Pleanála reports a surge in fast-track approvals for large scale residential developments in commuter counties.",
    date: "05 Mar 2024",
    source: "Construction Journal",
    category: "Construction",
    readTime: "5 min read",
    author: "David Walsh",
    image: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&q=80&w=1000",
    content: (
        <div className="space-y-6 text-slate-700 leading-relaxed">
            <p className="text-lg">There is a glimmer of hope on the supply horizon as planning permission approvals for Q4 2023 reached their highest level since 2018. The surge is largely driven by apartment complexes in commuter counties surrounding Dublin, such as Kildare, Meath, and Louth.</p>
            <p>While approval is the first step, commencement remains the bottleneck. Viability issues due to construction cost inflation have stalled approximately 30% of already approved sites.</p>
            <p>"We have the paper permits," said CIF Director Tom Parlon. "Now we need the infrastructure—water, electricity, and roads—to actually turn sod on these sites."</p>
        </div>
    )
  }
];

const ArticleModal = ({ article, onClose }: { article: Article, onClose: () => void }) => {
    return (
        <div 
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div 
                className="bg-white w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 relative"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header Image */}
                <div className="relative h-64 shrink-0">
                     <img 
                        src={article.image} 
                        alt={article.title} 
                        className="w-full h-full object-cover"
                     />
                     <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                     <button 
                        onClick={onClose}
                        className="absolute top-4 right-4 bg-black/40 hover:bg-black/60 text-white p-2 rounded-full backdrop-blur-md transition-colors"
                     >
                        <X className="w-5 h-5" />
                     </button>
                     <div className="absolute bottom-0 left-0 p-6 text-white w-full">
                         <div className="flex items-center gap-3 mb-2 text-sm font-medium opacity-90">
                             <span className="bg-emerald-500 px-2 py-0.5 rounded text-white">{article.category}</span>
                             <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {article.date}</span>
                             <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {article.readTime}</span>
                         </div>
                         <h2 className="text-2xl md:text-3xl font-bold leading-tight shadow-sm">{article.title}</h2>
                     </div>
                </div>

                {/* Content */}
                <div className="p-6 md:p-8 overflow-y-auto">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500">
                                {article.author.charAt(0)}
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-900">{article.author}</p>
                                <p className="text-xs text-slate-500">{article.source}</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                             <button className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-full transition-colors" title="Save Article">
                                <Bookmark className="w-5 h-5" />
                             </button>
                             <button className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-full transition-colors" title="Share">
                                <Share2 className="w-5 h-5" />
                             </button>
                        </div>
                    </div>

                    <div className="prose prose-slate max-w-none">
                        {article.content}
                    </div>
                </div>
            </div>
        </div>
    );
};

const MarketNews: React.FC = () => {
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  return (
    <div className="max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
           <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm uppercase tracking-wider mb-1">
               <Newspaper className="w-4 h-4" /> Market Intelligence
           </div>
           <h1 className="text-3xl font-bold text-slate-900">Irish Property News</h1>
           <p className="text-slate-500 mt-2 max-w-xl">
             Stay informed with the latest trends, regulations, and market movements affecting Irish real estate.
           </p>
        </div>
        <div className="text-right hidden md:block">
            <p className="text-sm text-slate-500">Last updated</p>
            <p className="font-medium text-slate-900">{new Date().toLocaleDateString('en-IE', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </div>
      </div>

      {/* Featured Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {MOCK_ARTICLES.map((article, index) => {
              // Highlight the first article slightly differently
              const isFeatured = index === 0;
              
              return (
                  <div 
                    key={article.id} 
                    onClick={() => setSelectedArticle(article)}
                    className={`group bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden cursor-pointer hover:shadow-lg hover:border-emerald-200 hover:-translate-y-1 transition-all duration-300 flex flex-col ${isFeatured ? 'md:col-span-2 lg:col-span-2' : ''}`}
                  >
                      <div className={`relative overflow-hidden ${isFeatured ? 'h-64 md:h-80' : 'h-48'}`}>
                          <img 
                             src={article.image} 
                             alt={article.title} 
                             className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                          />
                          <div className="absolute top-4 left-4">
                              <span className="bg-white/90 backdrop-blur-sm text-slate-800 text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                                  {article.category}
                              </span>
                          </div>
                      </div>
                      
                      <div className="p-6 flex-1 flex flex-col">
                          <div className="flex items-center gap-3 text-xs text-slate-500 mb-3">
                              <span className="font-medium text-emerald-600">{article.source}</span>
                              <span>•</span>
                              <span>{article.date}</span>
                          </div>
                          
                          <h3 className={`font-bold text-slate-900 mb-3 group-hover:text-emerald-700 transition-colors ${isFeatured ? 'text-2xl' : 'text-lg'}`}>
                              {article.title}
                          </h3>
                          
                          <p className="text-slate-500 text-sm leading-relaxed mb-4 line-clamp-3 flex-1">
                              {article.summary}
                          </p>
                          
                          <div className="flex items-center justify-between pt-4 border-t border-slate-50 mt-auto">
                              <span className="text-xs text-slate-400 flex items-center gap-1">
                                  <Clock className="w-3 h-3" /> {article.readTime}
                              </span>
                              <span className="text-sm font-bold text-emerald-600 flex items-center gap-1 group-hover:gap-2 transition-all">
                                  Read Article <ArrowRight className="w-4 h-4" />
                              </span>
                          </div>
                      </div>
                  </div>
              );
          })}
      </div>

      {/* Modal */}
      {selectedArticle && (
          <ArticleModal article={selectedArticle} onClose={() => setSelectedArticle(null)} />
      )}
    </div>
  );
};

export default MarketNews;