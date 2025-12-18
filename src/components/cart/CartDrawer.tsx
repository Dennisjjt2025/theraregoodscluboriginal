import { useState } from 'react';
import { ShoppingCart, Minus, Plus, Trash2 } from 'lucide-react';
import { useCartStore } from '@/stores/cartStore';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';

export function CartDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const { language } = useLanguage();
  const {
    items,
    updateQuantity,
    removeItem,
    getTotalItems,
    getTotalPrice,
  } = useCartStore();

  const totalItems = getTotalItems();
  const totalPrice = getTotalPrice();

  const t = {
    cart: language === 'nl' ? 'Winkelwagen' : 'Shopping Cart',
    empty: language === 'nl' ? 'Je winkelwagen is leeg' : 'Your cart is empty',
    items: (n: number) =>
      language === 'nl'
        ? `${n} ${n === 1 ? 'item' : 'items'} in je winkelwagen`
        : `${n} ${n === 1 ? 'item' : 'items'} in your cart`,
    total: language === 'nl' ? 'Totaal' : 'Total',
    checkoutInfo: language === 'nl' 
      ? 'Checkout is momenteel niet beschikbaar' 
      : 'Checkout is currently not available',
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <button className="relative p-2 text-foreground hover:text-accent transition-colors">
          <ShoppingCart className="w-5 h-5" />
          {totalItems > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-accent text-accent-foreground text-xs font-bold rounded-full flex items-center justify-center">
              {totalItems}
            </span>
          )}
        </button>
      </SheetTrigger>

      <SheetContent className="w-full sm:max-w-md flex flex-col h-full">
        <SheetHeader className="flex-shrink-0">
          <SheetTitle className="font-serif">{t.cart}</SheetTitle>
          <SheetDescription>
            {totalItems === 0 ? t.empty : t.items(totalItems)}
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col flex-1 pt-6 min-h-0">
          {items.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">{t.empty}</p>
              </div>
            </div>
          ) : (
            <>
              {/* Scrollable items */}
              <div className="flex-1 overflow-y-auto pr-2 min-h-0 space-y-4">
                {items.map((item) => (
                  <div
                    key={item.variantId}
                    className="flex gap-4 p-3 bg-card border border-border rounded-lg"
                  >
                    {/* Image */}
                    <div className="w-16 h-16 bg-muted rounded overflow-hidden flex-shrink-0">
                      {item.imageUrl && (
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate">{item.title}</h4>
                      <p className="font-serif text-lg">€{item.price.toFixed(2)}</p>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => removeItem(item.variantId)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>

                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center text-sm">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Fixed total section */}
              <div className="flex-shrink-0 space-y-4 pt-4 border-t border-border bg-background">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">{t.total}</span>
                  <span className="text-xl font-serif font-bold">€{totalPrice.toFixed(2)}</span>
                </div>

                <p className="text-sm text-muted-foreground text-center py-2">
                  {t.checkoutInfo}
                </p>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
