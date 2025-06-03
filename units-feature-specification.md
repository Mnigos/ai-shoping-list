# Units Handling Feature Specification

## Overview

This document outlines the implementation of a comprehensive units handling system for the AI Shopping List application. The feature will allow users to add items with specific units (kg, g, l, ml, pieces, etc.), display them in a standardized format, and handle intelligent unit conversions and arithmetic operations through both the UI and chat interface.

## Current State Analysis

### Database Schema

Currently, the `ShoppingListItem` model has:

- `id`: String (primary key)
- `name`: String (item name)
- `amount`: Int (simple integer amount)
- `isCompleted`: Boolean
- `userId`: String (foreign key)

### UI Components

- Basic form with name and amount (integer input)
- Items displayed as: "name" with separate amount input
- Simple add/edit/complete/delete functionality

### Chat Integration

- Natural language processing for adding items
- Basic actions: add, update, delete, complete
- No unit handling or conversions

## Feature Requirements

### 1. Database Schema Changes

- Add `unit` field to `ShoppingListItem` model
- Modify `amount` field to be a decimal/float for fractional amounts
- Maintain backward compatibility with existing data

### 2. UI Enhancements

#### Display Format

- Items shown as: "sugar (1kg)" format
- Clean, consistent unit display
- Support for various unit types

#### Add/Edit Form

- Unit selection dropdown/picker
- Amount field supporting decimals
- Validation for valid amount/unit combinations

#### Item Actions

- **Edit Button**: Opens modal with current name, amount, and unit
- **Delete Button**: Removes item completely
- Maintain existing complete/uncomplete functionality

#### Edit Modal

- Form fields for:
  - Item name (text input)
  - Amount (decimal input)
  - Unit (dropdown/select)
- Save/Cancel buttons
- Validation and error handling

### 3. Unit System

#### Supported Units

- **Weight**: kg, g, mg, oz, lb
- **Volume**: l, ml, cl, fl oz, cup, tbsp, tsp
- **Count**: pieces, pcs, items, boxes, packages
- **Length**: m, cm, mm, in, ft

#### Unit Conversions

- Automatic conversion between compatible units
- Preference for larger units when possible
- Intelligent rounding and precision

### 4. Chat Integration Enhancements

#### Natural Language Processing

- Parse commands like: "add 1kg of sugar", "remove 500g of flour"
- Extract item name, amount, and unit from user input
- Handle various formats and synonyms

#### Arithmetic Operations

Handle complex scenarios:

- **Addition with unit conversion**: "500g of sugar" + "add 1kg" = "1.5kg of sugar"
- **Subtraction with unit conversion**: "2kg of sugar" - "remove 500g" = "1.5kg of sugar"
- **Partial removal**: "1kg of sugar" - "remove 500g" = "500g of sugar"
- **Cross-unit operations**: Automatic conversion when needed

#### Edge Cases

- Adding to non-existent items (create new)
- Removing more than available (remove completely)
- Converting between unit systems
- Handling invalid unit combinations

## Implementation Plan

### Step 1: Database Migration

1. **Create Prisma Migration**

   ```sql
   -- Add new columns to existing table
   ALTER TABLE "shopping_list_item" ADD COLUMN "unit" TEXT DEFAULT 'pieces';
   ALTER TABLE "shopping_list_item" ALTER COLUMN "amount" TYPE DECIMAL(10,3);
   ```

2. **Update Prisma Schema**

   ```prisma
   model ShoppingListItem {
     id          String   @id @default(cuid())
     name        String
     amount      Decimal  @default(1)
     unit        String   @default("pieces")
     isCompleted Boolean  @default(false)
     createdAt   DateTime @default(now())
     updatedAt   DateTime @updatedAt
     userId      String
     user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

     @@map("shopping_list_item")
     @@index([userId])
     @@unique([userId, name])
   }
   ```

### Step 2: Unit System Implementation

1. **Create Unit Utilities (`app/utils/units.ts`)**
   - Unit definitions and conversions
   - Validation functions
   - Arithmetic operations with units
   - Formatting functions

2. **Key Functions**:

   ```typescript
   interface Unit {
     id: string
     name: string
     category: 'weight' | 'volume' | 'count' | 'length'
     baseMultiplier: number // conversion to base unit
     symbol: string
   }

   function convertUnits(amount: number, fromUnit: string, toUnit: string): number
   function addWithUnits(amount1: number, unit1: string, amount2: number, unit2: string): {amount: number, unit: string}
   function subtractWithUnits(amount1: number, unit1: string, amount2: number, unit2: string): {amount: number, unit: string} | null
   function formatAmount(amount: number, unit: string): string
   function parseAmountAndUnit(input: string): {amount: number, unit: string} | null
   ```

### Step 3: Backend API Updates

1. **Update Shopping List Router (`app/server/routers/shopping-list.ts`)**
   - Modify input schemas to include unit
   - Update all mutation handlers
   - Add unit validation

2. **Update Shopping List Helpers (`app/server/helpers/shopping-list.ts`)**
   - Implement unit-aware addition/subtraction
   - Handle unit conversions in database operations
   - Update action schemas

3. **New Action Schema**:

   ```typescript
   export const ShoppingListActionSchema = z.object({
     action: z.enum(['add', 'update', 'delete', 'complete']),
     name: z.string(),
     amount: z.number().min(0.001, 'Amount must be greater than 0').optional(),
     unit: z.string().optional(),
   })
   ```

### Step 4: UI Component Updates

1. **Update Shopping List Form (`app/components/shopping-list.tsx`)**
   - Add unit selection dropdown
   - Update form handling logic
   - Add validation

2. **Update Shopping List Item (`app/components/shopping-list-item.tsx`)**
   - Change display format to "name (amount unit)"
   - Add Edit and Delete buttons
   - Update amount editing to support decimals

3. **Create Edit Item Modal (`app/components/edit-item-modal.tsx`)**
   - Form with name, amount, and unit fields
   - Validation and error handling
   - Save/cancel functionality

4. **Create Unit Selector Component (`app/components/ui/unit-selector.tsx`)**
   - Dropdown/select component for unit selection
   - Categorized units display
   - Search functionality

### Step 5: Chat Integration Updates

1. **Update Assistant Router (`app/server/routers/assistant.ts`)**
   - Enhance prompt processing for units
   - Add unit parsing capabilities
   - Handle complex arithmetic scenarios

2. **Create Unit Parser (`app/utils/unit-parser.ts`)**
   - Extract amounts and units from natural language
   - Handle synonyms and variations
   - Support multiple formats

3. **Enhanced Action Processing**
   - Implement unit-aware arithmetic
   - Handle cross-unit operations
   - Manage edge cases

### Step 6: Mutation Hooks Updates

1. **Update existing hooks**:
   - `use-add-item-mutation.ts`: Add unit support
   - `use-update-item-mutation.ts`: Add unit support

2. **Create new hooks**:
   - `use-edit-item-mutation.ts`: For modal editing
   - `use-delete-item-mutation.ts`: For item deletion

### Step 7: Testing Strategy

1. **Unit Tests**
   - Unit conversion functions
   - Arithmetic operations
   - Parsing functions
   - Edge case handling

2. **Integration Tests**
   - API endpoints with units
   - Chat integration scenarios
   - Database operations

3. **E2E Tests**
   - Complete user workflows
   - Chat-based operations
   - Unit conversion scenarios

## Detailed Implementation Steps

### Phase 1: Core Infrastructure (Days 1-2)

1. **Database Migration**

   ```bash
   bun run prisma:migrate:dev --name add-units-to-shopping-list
   ```

2. **Unit System Implementation**
   - Create `app/utils/units.ts`
   - Implement unit definitions and conversions
   - Add comprehensive test coverage

3. **Type Definitions Update**
   - Update TypeScript interfaces
   - Add unit-related types

### Phase 2: Backend API (Days 3-4)

1. **Update TRPC Routes**
   - Modify input/output schemas
   - Add unit validation
   - Update error handling

2. **Enhance Action Handlers**
   - Implement unit-aware operations
   - Add conversion logic
   - Handle edge cases

3. **Testing**
   - Unit tests for API functions
   - Integration tests for complete flows

### Phase 3: UI Components (Days 5-6)

1. **Update Existing Components**
   - Shopping list form
   - Shopping list item display
   - Amount input handling

2. **Create New Components**
   - Edit item modal
   - Unit selector
   - Enhanced item actions

3. **UI Testing**
   - Component unit tests
   - Visual regression tests

### Phase 4: Chat Integration (Days 7-8)

1. **Natural Language Processing**
   - Implement unit parsing
   - Add arithmetic operations
   - Handle complex scenarios

2. **Assistant Enhancement**
   - Update prompt processing
   - Add unit-aware responses
   - Improve error handling

3. **Integration Testing**
   - End-to-end chat scenarios
   - Unit conversion testing
   - Edge case validation

### Phase 5: Polish and Optimization (Days 9-10)

1. **Performance Optimization**
   - Database query optimization
   - Frontend performance tuning
   - Caching strategies

2. **User Experience**
   - Loading states
   - Error messaging
   - Accessibility improvements

3. **Documentation**
   - API documentation
   - User guide updates
   - Developer documentation

## API Changes Summary

### New/Modified Endpoints

#### `shoppingList.addItem`

```typescript
input: {
  name: string
  amount: number
  unit: string
}
```

#### `shoppingList.updateItem`

```typescript
input: {
  id: string
  name?: string
  amount?: number
  unit?: string
}
```

#### `shoppingList.executeActions`

```typescript
input: {
  actions: Array<{
    action: 'add' | 'update' | 'delete' | 'complete'
    name: string
    amount?: number
    unit?: string
  }>
}
```

### New Endpoints

#### `shoppingList.editItem`

```typescript
input: {
  id: string
  name: string
  amount: number
  unit: string
}
```

## User Experience Flow

### Adding Items

1. **Manual Addition**:
   - User enters item name
   - Selects amount (decimal)
   - Chooses unit from dropdown
   - Clicks "Add"

2. **Chat Addition**:
   - User types: "add 2kg of potatoes"
   - System parses amount (2), unit (kg), item (potatoes)
   - Item appears as "potatoes (2kg)"

### Editing Items

1. User clicks Edit button on item
2. Modal opens with current values
3. User modifies name, amount, or unit
4. Changes are saved and displayed immediately

### Chat Operations

1. **Simple Addition**: "add 1kg sugar" → "sugar (1kg)"
2. **Unit Conversion**: existing "sugar (500g)" + "add 1kg" → "sugar (1.5kg)"
3. **Partial Removal**: "sugar (2kg)" + "remove 500g" → "sugar (1.5kg)"
4. **Complete Removal**: "sugar (500g)" + "remove 1kg" → item deleted

## Technical Considerations

### Performance

- Decimal arithmetic for precision
- Efficient unit conversion algorithms
- Optimized database queries
- Minimal re-renders in UI

### Accessibility

- Screen reader support for unit information
- Keyboard navigation for modals
- Clear labels and descriptions

### Security

- Input validation and sanitization
- Rate limiting for chat operations
- User data isolation

### Scalability

- Extensible unit system
- Configurable unit preferences
- Internationalization support

## Success Metrics

- All existing functionality preserved
- Units display correctly in all contexts
- Chat operations handle edge cases gracefully
- No performance regression
- Comprehensive test coverage (>90%)
- User-friendly error messages
- Intuitive unit conversion behavior

This specification provides a comprehensive roadmap for implementing the units handling feature while maintaining the existing functionality and ensuring a smooth user experience.
