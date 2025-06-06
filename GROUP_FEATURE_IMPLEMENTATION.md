# Group Feature Implementation Plan

## Feature Overview

The Group feature will allow users to create and manage groups, invite other users via shareable links or group codes, and share shopping lists across group members. The AI chat functionality will remain individual (stored in localStorage) while shopping lists become collaborative within groups.

### Key Requirements

- Personal groups are automatically created when users log in
- Anonymous users cannot create groups (disabled with tooltip prompting signup)
- Users with only personal groups see the interface as if they're not in any group
- Users can create groups and become group admins
- When creating a new group, users are prompted via modal to transfer their existing shopping list to the new group
- Users can join groups via shareable invite links or group codes
- Shopping lists are shared across all group members
- Real-time updates when group members modify shopping lists
- Group admins can manage members and group settings
- AI chat remains individual (localStorage-based)
- Users can be members of multiple groups
- Users can switch between different groups

### User Stories

1. **As a new user, I want a personal group created automatically** so I can start using the app immediately
2. **As an anonymous user, I want clear guidance to sign up** when trying to create or join groups
3. **As a user with only a personal group, I want a clean interface** that doesn't overwhelm me with group concepts
4. **As a user, I want to create a group** so that I can share shopping lists with family/friends
5. **As a user creating a new group, I want to be asked if I want to transfer my existing shopping list** so I don't lose my current items
6. **As a group admin, I want to generate shareable invite links** so others can easily join my group
7. **As a user, I want to join groups via invite links or codes** without complex invitation flows
8. **As a group member, I want to see updates in real-time** when others modify the shopping list
9. **As a user, I want to switch between groups** to manage different shopping contexts (family, work, etc.)
10. **As a group admin, I want to manage group members** including removing members and transferring admin rights
11. **As a user, I want to leave a group** when I no longer need access

### Technical Architecture

#### Database Schema Changes

- **Group** model: stores group information with invite codes and links
- **GroupMember** model: manages user-group relationships with roles
- **ShoppingListItem** model: updated to belong to groups instead of individual users
- **User** model: automatic personal group creation on signup/login

#### API Endpoints (TRPC)

Following the established pattern from `app/modules/shopping-list/server/` and `app/modules/chat/server/`:

- **Group router** (`app/modules/group/server/group.router.ts`)
- **Group service** (`app/modules/group/server/group.service.ts`)  
- **Group procedure** (`app/modules/group/server/group.procedure.ts`)
- **Group member router** (`app/modules/group/server/group-member.router.ts`)
- **Group member service** (`app/modules/group/server/group-member.service.ts`)

#### UI Components & Hooks

Following the established patterns:

- `app/modules/group/components/` - Group-specific React components
- `app/modules/group/hooks/` - Custom hooks with helpers subfolder
- `app/modules/group/stores/` - Zustand stores for group state management

---

## Individual Implementation Tasks

### Task 1: Database Schema Foundation

**Priority: High | Dependencies: None | Estimated Time: 2-3 hours**

Create the base database schema for groups functionality.

**Deliverables:**

- Updated `prisma/schema.prisma` with Group and GroupMember models
- Database migration file
- Schema validation tests

**Files to modify:**

- `prisma/schema.prisma`

**Acceptance Criteria:**

- Group model with id, name, description, inviteCode, isPersonal fields
- GroupMember model with userId, groupId, role, joinedAt fields
- Proper indexes and foreign key constraints
- Migration runs successfully without errors

**Definition of Done:**

- Schema is deployed and validated
- All foreign key relationships work correctly
- Indexes are created for performance

---

### Task 2: Personal Group Auto-Creation

**Priority: High | Dependencies: Task 1 | Estimated Time: 3-4 hours**

Implement automatic personal group creation when users sign up or log in.

**Deliverables:**

- Authentication flow updated to create personal groups
- Migration script for existing users
- Tests for personal group creation

**Files to create/modify:**

- `app/modules/group/server/helpers/personal-group.ts`
- `app/lib/auth.server.ts` (or equivalent auth file)
- `scripts/create-personal-groups-migration.ts`

**Acceptance Criteria:**

- New users get personal groups automatically
- Personal groups are marked with isPersonal=true
- Existing users get personal groups via migration
- Users are set as ADMIN of their personal groups

**Definition of Done:**

- All users have personal groups
- Authentication flow includes group creation
- Migration script tested and documented

---

### Task 3: Group Service and Router Foundation

**Priority: High | Dependencies: Task 1 | Estimated Time: 4-5 hours**

Following the established pattern from shopping-list module, create the core group service layer and router.

**Deliverables:**

- Group service class with CRUD operations
- Group TRPC router and procedure
- Comprehensive test coverage
- Input/output schemas

**Files to create:**

- `app/modules/group/server/group.service.ts`
- `app/modules/group/server/group.router.ts`
- `app/modules/group/server/group.procedure.ts`
- `app/modules/group/server/group.service.spec.ts`
- `app/modules/group/server/group.router.spec.ts`
- `app/modules/group/server/group.procedure.spec.ts`

**Acceptance Criteria:**

- GroupService class with createGroup, getMyGroups, getGroupDetails, updateGroup, deleteGroup methods
- Input schemas with Zod validation (CreateGroupInput, UpdateGroupInput, etc.)
- Protected procedure following the pattern from shopping-list
- Router with proper TRPCRouterRecord type
- 90%+ test coverage for service and router

**Definition of Done:**

- All CRUD operations work correctly
- Proper authorization checks in place
- Service follows established class-based pattern
- Router registered in main app router

---

### Task 4: Invite Code System

**Priority: High | Dependencies: Task 3 | Estimated Time: 3-4 hours**

Implement group invite code generation and validation system within the group service.

**Deliverables:**

- Invite code generation logic in GroupService
- Code validation and joining functionality
- Tests for invite system

**Files to modify/create:**

- Update `app/modules/group/server/group.service.ts`
- `app/modules/group/server/helpers/invite-validation.ts`
- Update test files

**Acceptance Criteria:**

- generateInviteCode method for group admins
- validateInviteCode method for checking codes
- joinViaCode method for joining groups
- Unique, secure invite codes using cuid()
- Proper error handling for invalid codes

**Definition of Done:**

- Invite codes are generated securely
- Code validation works correctly
- Users can join groups via codes
- Duplicate join attempts handled gracefully

---

### Task 5: Anonymous User Guards

**Priority: Medium | Dependencies: None | Estimated Time: 2-3 hours**

Create components and hooks to handle anonymous user restrictions.

**Deliverables:**

- Anonymous user detection hook
- Guard component for protected actions
- Tooltip component for disabled states

**Files to create:**

- `app/shared/hooks/use-auth-status.ts`
- `app/shared/components/auth/anonymous-user-guard.tsx`
- `app/shared/components/ui/disabled-tooltip.tsx`

**Acceptance Criteria:**

- useAuthStatus hook detects anonymous users
- AnonymousUserGuard component disables/enables children
- Tooltips show helpful messages for anonymous users
- Clear sign-up call-to-action

**Definition of Done:**

- Anonymous users can't access group features
- Clear messaging about required authentication
- Smooth UX for anonymous users

---

### Task 6: Group Store and State Management

**Priority: High | Dependencies: Task 3 | Estimated Time: 3-4 hours**

Create Zustand store for managing group state following the pattern from chat module.

**Deliverables:**

- Group store with state management
- Hooks for group operations
- Local storage persistence for active group

**Files to create:**

- `app/modules/group/stores/group.store.ts`
- `app/modules/group/hooks/use-groups.ts`
- `app/modules/group/hooks/use-active-group.ts`
- `app/modules/group/hooks/helpers/group-helpers.ts`

**Acceptance Criteria:**

- Store tracks current active group with persistence
- Store manages list of user's groups
- Personal group detection logic
- Persistence of active group selection using createJSONStorage
- Optimistic updates for better UX
- Proper TypeScript interfaces

**Definition of Done:**

- Group state is managed centrally
- Active group persists across sessions
- Store follows chat module pattern with middleware
- Proper error handling and loading states

---

### Task 7: Group Creation with Transfer Modal

**Priority: High | Dependencies: Task 5, Task 6 | Estimated Time: 5-6 hours**

Create the group creation flow with modal that asks users if they want to transfer their existing shopping list.

**Deliverables:**

- Create group dialog component
- Transfer existing list modal
- Group creation hooks following shopping-list patterns

**Files to create:**

- `app/modules/group/components/create-group-dialog.tsx`
- `app/modules/group/components/transfer-list-modal.tsx`
- `app/modules/group/hooks/use-create-group-mutation.ts`
- `app/modules/group/hooks/use-transfer-list-mutation.ts`
- Component test files

**Acceptance Criteria:**

- Create group dialog with name and description fields
- After successful group creation, show transfer modal if user has existing items
- Transfer modal shows current shopping list items count
- Option to transfer all items or keep them in personal group
- Hooks follow established mutation patterns with optimistic updates
- Anonymous users see disabled state with tooltips

**Definition of Done:**

- Users can create groups smoothly
- Transfer workflow is intuitive and clear
- Hooks follow established patterns from shopping-list
- Error handling and loading states implemented

---

### Task 8: Basic Group Interface Component

**Priority: High | Dependencies: Task 7 | Estimated Time: 4-5 hours**

Create the main group interface component that adapts based on user's group status.

**Deliverables:**

- Adaptive group interface component
- Group selector dropdown
- Integration with navigation

**Files to create:**

- `app/modules/group/components/group-interface.tsx`
- `app/modules/group/components/group-selector.tsx`
- Update navigation component

**Acceptance Criteria:**

- Shows "Create Group" button for users with only personal group
- Shows group selector for users with multiple groups
- Disabled state for anonymous users with tooltips
- Clean, intuitive interface following UI patterns
- Mobile responsive design

**Definition of Done:**

- Interface adapts to user's group status
- All user scenarios handled properly
- Responsive design works on mobile
- Integrated into main navigation

---

### Task 9: Join Group Dialog and Flow

**Priority: Medium | Dependencies: Task 4, Task 8 | Estimated Time: 3-4 hours**

Implement group joining functionality via codes with user-friendly interface.

**Deliverables:**

- Join group dialog component
- Group preview component
- Join group hook

**Files to create:**

- `app/modules/group/components/join-group-dialog.tsx`
- `app/modules/group/components/group-preview.tsx`
- `app/modules/group/hooks/use-join-group-mutation.ts`

**Acceptance Criteria:**

- Input field for group codes with validation
- Real-time validation feedback
- Group information display before joining
- Error handling for invalid codes
- Success feedback after joining
- Hook follows established mutation patterns

**Definition of Done:**

- Users can join groups via codes
- Clear feedback for all scenarios
- Smooth joining experience
- Proper error states and loading indicators

---

### Task 10: Shopping List Group Integration

**Priority: High | Dependencies: Task 2, Task 6 | Estimated Time: 5-6 hours**

Update shopping list functionality to work with groups instead of individual users, following the existing service patterns.

**Deliverables:**

- Updated shopping list service for group context
- Group-scoped shopping list operations
- Migration script for existing shopping lists
- Updated shopping list hooks

**Files to modify:**

- `app/modules/shopping-list/server/shopping-list.service.ts`
- Update ShoppingListItem model in schema
- `app/modules/shopping-list/hooks/use-add-item-mutation.ts` and others
- Create migration script

**Acceptance Criteria:**

- All shopping list operations scoped to groups
- Personal group used by default for single-group users
- Group membership verified for all operations in service layer
- Existing shopping lists migrated to personal groups
- Updated hooks to work with group context
- Service maintains same interface but with group awareness

**Definition of Done:**

- Shopping lists work within group context
- Proper authorization for group members
- Data migration completed successfully
- All existing hooks and components work seamlessly

---

### Task 11: Group Member Management

**Priority: Medium | Dependencies: Task 3 | Estimated Time: 4-5 hours**

Implement functionality for managing group members following the established service patterns.

**Deliverables:**

- Group member service and router
- Member list component
- Member management UI

**Files to create:**

- `app/modules/group/server/group-member.service.ts`
- `app/modules/group/server/group-member.router.ts`
- `app/modules/group/server/group-member.procedure.ts`
- `app/modules/group/components/group-member-list.tsx`
- `app/modules/group/components/member-management-dialog.tsx`
- `app/modules/group/hooks/use-member-management.ts`
- Test files

**Acceptance Criteria:**

- GroupMemberService with getMembers, removeMember, updateRole, leaveGroup methods
- Router following established TRPCRouterRecord pattern
- Member list with role indicators
- Management hooks following mutation patterns
- Proper authorization checks in service layer

**Definition of Done:**

- Group admins can manage members
- Members can leave groups
- Service layer follows established patterns
- Comprehensive test coverage

---

### Task 12: Invite Link Generation

**Priority: Medium | Dependencies: Task 4 | Estimated Time: 3-4 hours**

Create shareable invite links for groups with token-based joining, extending the existing group service.

**Deliverables:**

- Invite link generation in GroupService
- Link-based joining functionality
- Link management interface

**Files to modify/create:**

- Update `app/modules/group/server/group.service.ts`
- `app/modules/group/server/helpers/invite-tokens.ts`
- `app/modules/group/components/invite-link-dialog.tsx`
- `app/modules/group/hooks/use-invite-links.ts`

**Acceptance Criteria:**

- generateInviteLink method in GroupService
- Secure token generation using crypto
- joinViaLink method
- Copy-to-clipboard functionality
- Link expiration handling
- Service methods with proper input validation

**Definition of Done:**

- Shareable links work correctly
- Secure token system implemented
- Easy sharing interface provided
- Service maintains established patterns

---

### Task 13: Join Group Landing Page

**Priority: Medium | Dependencies: Task 12 | Estimated Time: 3-4 hours**

Create dedicated page for joining groups via invite links.

**Deliverables:**

- Join group route and page
- Authentication flow for anonymous users
- Group information display

**Files to create:**

- `app/routes/join-group.$token.tsx`
- `app/modules/group/components/join-group-page.tsx`

**Acceptance Criteria:**

- Validates invite link tokens using group service
- Shows group information before joining
- Prompts authentication for anonymous users
- Redirects to group after successful join
- Handles expired/invalid links gracefully

**Definition of Done:**

- Shareable links lead to functional landing page
- Authentication flow works smoothly
- Clear user experience throughout

---

### Task 14: Group Settings and Management Page

**Priority: Low | Dependencies: Task 11 | Estimated Time: 4-5 hours**

Create dedicated page for comprehensive group management.

**Deliverables:**

- Group management route and page
- Group settings interface
- Advanced member management

**Files to create:**

- `app/routes/groups.tsx`
- `app/routes/groups.$groupId.tsx`
- `app/modules/group/components/group-settings-page.tsx`

**Acceptance Criteria:**

- Group overview and settings
- Member management interface
- Invite management (codes and links)
- Group deletion with confirmation
- Admin-only features properly gated

**Definition of Done:**

- Comprehensive group management available
- All group admin functions accessible
- User-friendly interface design

---

### Task 15: Shopping List UI Updates

**Priority: Medium | Dependencies: Task 10, Task 8 | Estimated Time: 3-4 hours**

Update shopping list components to show group context and member attribution.

**Deliverables:**

- Updated shopping list components
- Group name display logic
- Member attribution for items

**Files to modify:**

- `app/modules/shopping-list/components/shopping-list.tsx`
- `app/modules/shopping-list/components/shopping-list-item.tsx`

**Acceptance Criteria:**

- Group name shown in header (hidden for personal-only)
- "Added by [Name]" attribution on items
- Group context clear throughout interface
- Smooth transitions when switching groups

**Definition of Done:**

- Shopping list reflects group context
- User attribution works correctly
- Interface remains clean and intuitive

---

### Task 16: Personal Group Data Migration

**Priority: High | Dependencies: Task 2, Task 10 | Estimated Time: 2-3 hours**

Create and execute migration for existing users and shopping lists.

**Deliverables:**

- Data migration script
- Verification and rollback procedures
- Migration documentation

**Files to create:**

- `scripts/migrate-existing-data.ts`
- `scripts/verify-migration.ts`

**Acceptance Criteria:**

- All existing users get personal groups
- All existing shopping lists moved to personal groups
- Data integrity maintained
- Rollback procedure available
- Migration can be run safely in production

**Definition of Done:**

- Migration script tested and documented
- All existing data properly migrated
- No data loss or corruption

---

### Task 17: Group Feature Testing Suite

**Priority: Medium | Dependencies: All above tasks | Estimated Time: 6-8 hours**

Create comprehensive test suite for group functionality following established testing patterns.

**Deliverables:**

- Service and router tests
- Component tests for group UI
- Hook tests
- Integration tests for workflows

**Files to create:**

- Service test files (following shopping-list.service.spec.ts pattern)
- Router test files (following shopping-list.router.spec.ts pattern)
- Component test files
- Hook test files
- Integration test files

**Acceptance Criteria:**

- 90%+ test coverage for group functionality
- All critical user flows tested
- Tests follow established patterns from shopping-list module
- Edge cases and error scenarios covered
- Tests run reliably in CI/CD

**Definition of Done:**

- Comprehensive test suite implemented
- All tests passing consistently
- Group feature is well-tested and reliable

---

### Task 18: Performance Optimization

**Priority: Low | Dependencies: Task 17 | Estimated Time: 3-4 hours**

Optimize group functionality for performance and scalability.

**Deliverables:**

- Database query optimization in services
- Frontend performance improvements
- Caching strategies

**Files to modify:**

- Various group service files for query optimization
- Store optimizations
- Hook optimizations

**Acceptance Criteria:**

- Efficient database queries with proper joins in services
- Frontend caching for group data in stores
- Optimistic updates following shopping-list patterns
- Lazy loading where appropriate

**Definition of Done:**

- Group operations perform well under load
- Good user experience with fast responses
- Scalable architecture for growth

---

## Updated Technical Architecture

### Module Structure

Following the established pattern:

```
app/modules/group/
├── components/           # React components
│   ├── create-group-dialog.tsx
│   ├── transfer-list-modal.tsx
│   ├── group-interface.tsx
│   ├── group-selector.tsx
│   ├── join-group-dialog.tsx
│   └── group-member-list.tsx
├── hooks/               # Custom hooks
│   ├── helpers/         # Hook helper functions
│   ├── use-create-group-mutation.ts
│   ├── use-join-group-mutation.ts
│   └── use-groups.ts
├── server/              # Server-side code
│   ├── helpers/         # Server helper functions
│   ├── group.service.ts
│   ├── group.router.ts
│   ├── group.procedure.ts
│   ├── group-member.service.ts
│   ├── group-member.router.ts
│   └── group-member.procedure.ts
└── stores/              # Zustand stores
    └── group.store.ts
```

### Service Layer Pattern

Following the established pattern from `ShoppingListService`:

```typescript
// app/modules/group/server/group.service.ts
export class GroupService {
  constructor(private readonly ctx: ProtectedContext) {}
  
  async createGroup(input: CreateGroupInput) { /* ... */ }
  async getMyGroups() { /* ... */ }
  async updateGroup(input: UpdateGroupInput) { /* ... */ }
  // ... other methods
}

// Input schemas with Zod
export const CreateGroupInputSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
})
```

### Router Pattern

Following the established pattern:

```typescript
// app/modules/group/server/group.router.ts
export const groupRouter = {
  createGroup: groupProcedure
    .input(CreateGroupInputSchema)
    .mutation(async ({ ctx, input }) => ctx.service.createGroup(input)),
  
  getMyGroups: groupProcedure
    .query(async ({ ctx }) => ctx.service.getMyGroups()),
  
  // ... other endpoints
} satisfies TRPCRouterRecord
```

### Hook Pattern

Following the shopping-list mutation hook pattern:

```typescript
// app/modules/group/hooks/use-create-group-mutation.ts
export function useCreateGroupMutation() {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  
  return useMutation(
    trpc.group.createGroup.mutationOptions({
      onSuccess: (data) => {
        // Optimistic updates
        queryClient.setQueryData(/* ... */)
      },
      // ... error handling
    })
  )
}
```

### Store Pattern

Following the chat store pattern with persistence:

```typescript
// app/modules/group/stores/group.store.ts
interface GroupStore {
  activeGroupId: string | null
  groups: Group[]
  setActiveGroup: (groupId: string) => void
  // ... other methods
}

export const useGroupStore = create<GroupStore>()(
  persist(
    (set) => ({
      // ... store implementation
    }),
    {
      name: 'group',
      storage: createJSONStorage(() => localStorage),
      // ... persistence config
    }
  )
)
```

---

## Updated Database Schema

### New Models

```prisma
model Group {
  id          String   @id @default(cuid())
  name        String
  description String?
  inviteCode  String   @unique @default(cuid())
  isPersonal  Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Relations
  members           GroupMember[]
  shoppingListItems ShoppingListItem[]
  
  @@map("group")
  @@index([inviteCode])
}

model GroupMember {
  id        String    @id @default(cuid())
  role      GroupRole @default(MEMBER)
  joinedAt  DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  
  // Foreign keys
  userId    String
  groupId   String
  
  // Relations
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  group     Group     @relation(fields: [groupId], references: [id], onDelete: Cascade)
  
  @@unique([userId, groupId])
  @@map("group_member")
  @@index([groupId])
  @@index([userId])
}

enum GroupRole {
  ADMIN
  MEMBER
}
```

### Updated Models

```prisma
model User {
  // ... existing fields ...
  
  // New relations
  groupMemberships    GroupMember[]
}

model ShoppingListItem {
  // ... existing fields except userId ...
  
  // Replace userId with groupId
  groupId   String
  group     Group    @relation(fields: [groupId], references: [id], onDelete: Cascade)
  
  // Add createdById to track who added the item
  createdById String
  createdBy   User   @relation(fields: [createdById], references: [id], onDelete: Cascade)
  
  @@map("shopping_list_item")
  @@index([groupId])
  @@unique([groupId, name]) // Unique per group instead of per user
}
```

---

## Key Features

### Transfer Existing List Modal

When a user creates their first non-personal group, they will be prompted with a modal asking:

- **Title**: "Transfer Your Shopping List?"
- **Content**: "You have X items in your personal shopping list. Would you like to transfer them to your new group '[Group Name]'?"
- **Options**:
  - "Transfer Items" (primary button) - moves all items to new group
  - "Keep Personal" (secondary button) - items stay in personal group
  - "Cancel" - goes back to group creation

This ensures users don't lose their existing shopping list when creating their first collaborative group.

---

## Task Dependencies Chart

```
Task 1 (Database Schema) 
├── Task 2 (Personal Groups)
├── Task 3 (Group Service & Router)
│   ├── Task 4 (Invite Codes)
│   ├── Task 6 (Group Store)
│   └── Task 11 (Member Management)
│       └── Task 14 (Management Page)
└── Task 10 (Shopping List Integration)

Task 5 (Anonymous Guards) ── Task 7 (Group Creation + Transfer Modal)
                            ├── Task 8 (Group Interface)
                            └── Task 9 (Join Dialog)

Task 4 (Invite Codes) ── Task 12 (Invite Links) ── Task 13 (Landing Page)

Task 10 + Task 8 ── Task 15 (Shopping List UI)

Task 2 + Task 10 ── Task 16 (Data Migration)

All Tasks ── Task 17 (Testing) ── Task 18 (Performance)
```

---

## Implementation Priority

**Phase 1 (Core Foundation):**

- Task 1: Database Schema Foundation
- Task 2: Personal Group Auto-Creation  
- Task 3: Group Service and Router Foundation
- Task 5: Anonymous User Guards

**Phase 2 (Basic Group Functionality):**

- Task 4: Invite Code System
- Task 6: Group Store and State Management
- Task 7: Group Creation with Transfer Modal
- Task 10: Shopping List Group Integration

**Phase 3 (User Experience):**

- Task 8: Basic Group Interface Component
- Task 9: Join Group Dialog and Flow
- Task 15: Shopping List UI Updates
- Task 16: Personal Group Data Migration

**Phase 4 (Advanced Features):**

- Task 11: Group Member Management
- Task 12: Invite Link Generation
- Task 13: Join Group Landing Page
- Task 14: Group Settings and Management Page

**Phase 5 (Quality and Performance):**

- Task 17: Group Feature Testing Suite
- Task 18: Performance Optimization
