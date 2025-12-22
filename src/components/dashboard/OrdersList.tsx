import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Package, Truck, CheckCircle, Clock, ExternalLink } from 'lucide-react';
import { getOptimizedImageUrl } from '@/lib/imageUtils';

export interface OrderHistoryItem {
  id: string;
  drop_id: string;
  purchased: boolean;
  quantity: number;
  created_at: string;
  shopify_order_id: string | null;
  drop?: {
    title_en: string;
    title_nl: string;
    price: number;
    image_url: string | null;
  };
  shopifyDetails?: {
    orderNumber: string;
    fulfillmentStatus: string;
    financialStatus: string;
    trackingInfo?: Array<{ number: string; url: string }>;
    deliveredAt?: string | null;
    estimatedDeliveryAt?: string | null;
  };
}

interface OrdersListProps {
  orders: OrderHistoryItem[];
  loading?: boolean;
}

export function OrdersList({ orders, loading }: OrdersListProps) {
  const { language, t } = useLanguage();

  const getFulfillmentStatus = (status: string | undefined) => {
    if (!status) return { label: language === 'nl' ? 'In behandeling' : 'Processing', icon: Clock, color: 'text-muted-foreground' };
    
    switch (status.toUpperCase()) {
      case 'FULFILLED':
        return { label: language === 'nl' ? 'Verzonden' : 'Shipped', icon: Truck, color: 'text-blue-600' };
      case 'DELIVERED':
        return { label: language === 'nl' ? 'Bezorgd' : 'Delivered', icon: CheckCircle, color: 'text-green-600' };
      case 'UNFULFILLED':
        return { label: language === 'nl' ? 'In behandeling' : 'Processing', icon: Package, color: 'text-amber-600' };
      case 'PARTIALLY_FULFILLED':
        return { label: language === 'nl' ? 'Gedeeltelijk verzonden' : 'Partially Shipped', icon: Truck, color: 'text-amber-600' };
      default:
        return { label: status, icon: Clock, color: 'text-muted-foreground' };
    }
  };

  const translations = {
    purchaseHistory: language === 'nl' ? 'Bestelgeschiedenis' : 'Order History',
    noPurchases: language === 'nl' ? 'Je hebt nog geen bestellingen' : 'You have no orders yet',
    orderNumber: language === 'nl' ? 'Bestelnummer' : 'Order',
    trackOrder: language === 'nl' ? 'Track & Trace' : 'Track Order',
    purchased: language === 'nl' ? 'Gekocht' : 'Purchased',
    estimatedDelivery: language === 'nl' ? 'Verwachte levering' : 'Estimated delivery',
    deliveredOn: language === 'nl' ? 'Bezorgd op' : 'Delivered on',
  };

  if (loading) {
    return (
      <div className="bg-card border border-border p-6">
        <h2 className="font-serif text-xl mb-6">{translations.purchaseHistory}</h2>
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="flex gap-4 p-4 bg-muted/30 border border-border animate-pulse">
              <div className="w-20 h-20 bg-muted rounded" />
              <div className="flex-1 space-y-2">
                <div className="h-5 bg-muted rounded w-1/2" />
                <div className="h-4 bg-muted rounded w-1/4" />
                <div className="h-3 bg-muted rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border p-6">
      <h2 className="font-serif text-xl mb-6">{translations.purchaseHistory}</h2>
      
      {orders.length > 0 ? (
        <div className="space-y-4">
          {orders.map((order) => {
            const status = getFulfillmentStatus(order.shopifyDetails?.fulfillmentStatus);
            const StatusIcon = status.icon;
            const dropTitle = language === 'nl' ? order.drop?.title_nl : order.drop?.title_en;
            const totalPrice = (order.drop?.price || 0) * order.quantity;

            return (
              <div
                key={order.id}
                className="flex flex-col sm:flex-row gap-4 p-4 bg-muted/30 border border-border rounded-lg"
              >
                {/* Image */}
                {order.drop?.image_url && (
                  <div className="w-full sm:w-24 h-32 sm:h-24 flex-shrink-0 overflow-hidden rounded">
                    <img
                      src={getOptimizedImageUrl(order.drop.image_url, { width: 200, quality: 80 })}
                      alt={dropTitle}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h3 className="font-serif text-lg leading-tight">{dropTitle}</h3>
                      {order.shopifyDetails?.orderNumber && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {translations.orderNumber}: {order.shopifyDetails.orderNumber}
                        </p>
                      )}
                    </div>
                    
                    {/* Status Badge */}
                    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${status.color} bg-current/10`}>
                      <StatusIcon className="w-3.5 h-3.5" />
                      <span>{status.label}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm">
                    <span className="font-medium">
                      {order.quantity > 1 ? `${order.quantity}× ` : ''}€{totalPrice.toFixed(2)}
                    </span>
                    <span className="text-muted-foreground">
                      {new Date(order.created_at).toLocaleDateString(language === 'nl' ? 'nl-NL' : 'en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>

                  {/* Tracking Info */}
                  {order.shopifyDetails?.trackingInfo && order.shopifyDetails.trackingInfo.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-border/50">
                      {order.shopifyDetails.trackingInfo.map((tracking, idx) => (
                        <a
                          key={idx}
                          href={tracking.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-sm text-accent hover:underline"
                        >
                          <Truck className="w-4 h-4" />
                          {translations.trackOrder}: {tracking.number}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ))}
                    </div>
                  )}

                  {/* Delivery Info */}
                  {order.shopifyDetails?.deliveredAt && (
                    <p className="text-xs text-green-600 mt-2">
                      {translations.deliveredOn} {new Date(order.shopifyDetails.deliveredAt).toLocaleDateString(language === 'nl' ? 'nl-NL' : 'en-GB')}
                    </p>
                  )}
                  {order.shopifyDetails?.estimatedDeliveryAt && !order.shopifyDetails.deliveredAt && (
                    <p className="text-xs text-muted-foreground mt-2">
                      {translations.estimatedDelivery}: {new Date(order.shopifyDetails.estimatedDeliveryAt).toLocaleDateString(language === 'nl' ? 'nl-NL' : 'en-GB')}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">{translations.noPurchases}</p>
          <Link to="/drop" className="btn-outline-luxury mt-4 inline-block">
            {language === 'nl' ? 'Bekijk de huidige drop' : 'View current drop'}
          </Link>
        </div>
      )}
    </div>
  );
}
