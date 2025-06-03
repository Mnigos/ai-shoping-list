# Group Feature Implementation Plan

## Feature Overview

The Group feature will allow users to create and manage groups, invite other users via shareable links or group codes, and share shopping lists across group members. The AI chat functionality will remain individual (stored in localStorage) while shopping lists become collaborative within groups.

### Key Requirements

- Personal groups are automatically created when users log in
- Anonymous users cannot create groups (disabled with tooltip prompting signup)
- Users with only personal groups see the interface as if they're not in any group
- Users can create groups and become group admins
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
5. **As a group admin, I want to generate shareable invite links** so others can easily join my group
6. **As a user, I want to join groups via invite links or codes** without complex invitation flows
7. **As a group member, I want to see updates in real-time** when others modify the shopping list
8. **As a user, I want to switch between groups** to manage different shopping contexts (family, work, etc.)
9. **As a group admin, I want to manage group members** including removing members and transferring admin rights
10. **As a user, I want to leave a group** when I no longer need access

### Technical Architecture

#### Database Schema Changes

- **Group** model: stores group information with invite codes and links
- **GroupMember** model: manages user-group relationships with roles
- **ShoppingListItem** model: updated to belong to groups instead of individual users
- **User** model: automatic personal group creation on signup/login

#### API Endpoints (TRPC)

- Group management (create, update, delete, get)
- Member management (join via link/code, remove, update role)
- Invite link/code generation and validation
- Shopping list operations (scoped to active group)

#### UI Components

- Combined group selector/creator/joiner interface
- Group management dashboard
- Member management interface
- Anonymous user restrictions with tooltips

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

- `app/server/helpers/personal-group.ts`
- `app/lib/auth.server.ts` (or equivalent)
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

### Task 3: Basic Group CRUD Operations

**Priority: High | Dependencies: Task 1 | Estimated Time: 4-5 hours**

Implement core group creation, reading, updating, and deletion operations.

**Deliverables:**

- TRPC router for group operations
- Group validation logic
- Tests for CRUD operations

**Files to create:**

- `app/server/routers/group.ts`
- `app/server/helpers/group-validation.ts`
- `app/server/routers/__tests__/group.spec.ts`

**Acceptance Criteria:**

- createGroup endpoint (authenticated users only)
- getMyGroups endpoint (excludes personal if only group)
- getGroupDetails endpoint with member info
- updateGroup endpoint (admin only)
- deleteGroup endpoint (admin only, not personal groups)

**Definition of Done:**

- All CRUD operations work correctly
- Proper authorization checks in place
- Comprehensive test coverage
- API documented

---

### Task 4: Invite Code System

**Priority: High | Dependencies: Task 3 | Estimated Time: 3-4 hours**

Implement group invite code generation and validation system.

**Deliverables:**

- Invite code generation logic
- Code validation and joining functionality
- Tests for invite system

**Files to create/modify:**

- `app/server/helpers/invite-codes.ts`
- Update `app/server/routers/group.ts`

**Acceptance Criteria:**

- generateInviteCode endpoint for group admins
- validateInviteCode endpoint for checking codes
- joinViaCode endpoint for joining groups
- Unique, secure invite codes
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

- `app/hooks/use-auth-status.ts`
- `app/components/auth/anonymous-user-guard.tsx`
- `app/components/ui/disabled-tooltip.tsx`

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

Create Zustand store for managing group state and active group selection.

**Deliverables:**

- Group store with state management
- Hooks for group operations
- Local storage persistence for active group

**Files to create:**

- `app/stores/group-store.ts`
- `app/hooks/use-groups.ts`
- `app/hooks/use-active-group.ts`

**Acceptance Criteria:**

- Store tracks current active group
- Store manages list of user's groups
- Personal group detection logic
- Persistence of active group selection
- Optimistic updates for better UX

**Definition of Done:**

- Group state is managed centrally
- Active group persists across sessions
- Proper error handling and loading states

---

### Task 7: Basic Group Interface Component

**Priority: High | Dependencies: Task 5, Task 6 | Estimated Time: 4-5 hours**

Create the main group interface component that adapts based on user's group status.

**Deliverables:**

- Adaptive group interface component
- Create group dialog
- Group selector dropdown

**Files to create:**

- `app/components/group-interface.tsx`
- `app/components/group/create-group-dialog.tsx`
- `app/components/group/group-selector.tsx`

**Acceptance Criteria:**

- Shows "Create Group" button for users with only personal group
- Shows group selector for users with multiple groups
- Disabled state for anonymous users with tooltips
- Clean, intuitive interface

**Definition of Done:**

- Interface adapts to user's group status
- All user scenarios handled properly
- Responsive design works on mobile

---

### Task 8: Join Group Dialog and Flow

**Priority: Medium | Dependencies: Task 4, Task 7 | Estimated Time: 3-4 hours**

Implement group joining functionality via codes with user-friendly interface.

**Deliverables:**

- Join group dialog component
- Code validation UI
- Group preview before joining

**Files to create:**

- `app/components/group/join-group-dialog.tsx`
- `app/components/group/group-preview.tsx`

**Acceptance Criteria:**

- Input field for group codes
- Real-time validation feedback
- Group information display before joining
- Error handling for invalid codes
- Success feedback after joining

**Definition of Done:**

- Users can join groups via codes
- Clear feedback for all scenarios
- Smooth joining experience

---

### Task 9: Shopping List Group Integration

**Priority: High | Dependencies: Task 2, Task 6 | Estimated Time: 5-6 hours**

Update shopping list functionality to work with groups instead of individual users.

**Deliverables:**

- Updated shopping list TRPC router
- Group-scoped shopping list operations
- Migration script for existing shopping lists

**Files to modify:**

- `app/server/routers/shopping-list.ts`
- `app/server/helpers/shopping-list.ts`
- Update ShoppingListItem model in schema

**Acceptance Criteria:**

- All shopping list operations scoped to groups
- Personal group used by default for single-group users
- Group membership verified for all operations
- Existing shopping lists migrated to personal groups

**Definition of Done:**

- Shopping lists work within group context
- Proper authorization for group members
- Data migration completed successfully

---

### Task 10: Navigation Integration

**Priority: Medium | Dependencies: Task 7 | Estimated Time: 2-3 hours**

Integrate group interface into the main navigation bar.

**Deliverables:**

- Updated navigation component
- Group context display
- Mobile-responsive group controls

**Files to modify:**

- `app/components/navigation-bar.tsx`

**Acceptance Criteria:**

- Group interface prominently placed in navigation
- Current group name displayed (hidden for personal-only)
- Mobile-friendly group switching
- Consistent with overall app design

**Definition of Done:**

- Group functionality accessible from navigation
- Works well on all screen sizes
- Visual hierarchy maintained

---

### Task 11: Group Member Management

**Priority: Medium | Dependencies: Task 3 | Estimated Time: 4-5 hours**

Implement functionality for managing group members (view, remove, change roles).

**Deliverables:**

- Group member management TRPC router
- Member list component
- Member management UI

**Files to create:**

- `app/server/routers/group-member.ts`
- `app/components/group/group-member-list.tsx`
- `app/components/group/member-management-dialog.tsx`

**Acceptance Criteria:**

- getGroupMembers endpoint
- removeMember endpoint (admin only)
- updateMemberRole endpoint (admin only)
- leaveGroup functionality
- Member list with role indicators

**Definition of Done:**

- Group admins can manage members
- Members can leave groups
- Proper permission checks in place

---

### Task 12: Invite Link Generation

**Priority: Medium | Dependencies: Task 4 | Estimated Time: 3-4 hours**

Create shareable invite links for groups with token-based joining.

**Deliverables:**

- Invite link generation system
- Link-based joining functionality
- Link management interface

**Files to create/modify:**

- `app/server/helpers/invite-links.ts`
- Update `app/server/routers/group.ts`
- `app/components/group/invite-link-dialog.tsx`

**Acceptance Criteria:**

- generateInviteLink endpoint
- Secure token generation
- joinViaLink endpoint
- Copy-to-clipboard functionality
- Link expiration handling

**Definition of Done:**

- Shareable links work correctly
- Secure token system implemented
- Easy sharing interface provided

---

### Task 13: Join Group Landing Page

**Priority: Medium | Dependencies: Task 12 | Estimated Time: 3-4 hours**

Create dedicated page for joining groups via invite links.

**Deliverables:**

- Join group route and page
- Authentication flow for anonymous users
- Group information display

**Files to create:**

- `app/routes/join-group/[token].tsx`
- `app/components/group/join-group-page.tsx`

**Acceptance Criteria:**

- Validates invite link tokens
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
- `app/routes/groups/[groupId].tsx`
- `app/components/group/group-settings-page.tsx`

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

**Priority: Medium | Dependencies: Task 9, Task 10 | Estimated Time: 3-4 hours**

Update shopping list components to show group context and member attribution.

**Deliverables:**

- Updated shopping list components
- Group name display logic
- Member attribution for items

**Files to modify:**

- `app/components/shopping-list.tsx`
- `app/components/shopping-list-item.tsx`

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

**Priority: High | Dependencies: Task 2, Task 9 | Estimated Time: 2-3 hours**

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

Create comprehensive test suite for group functionality.

**Deliverables:**

- Unit tests for all TRPC routes
- Component tests for group UI
- Integration tests for workflows
- E2E tests for critical paths

**Files to create:**

- `app/server/routers/__tests__/group.spec.ts`
- `app/server/routers/__tests__/group-member.spec.ts`
- `app/components/group/__tests__/group-interface.spec.tsx`
- `app/hooks/__tests__/use-groups.spec.ts`
- `e2e/group-workflows.spec.ts`

**Acceptance Criteria:**

- 90%+ test coverage for group functionality
- All critical user flows tested
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

- Database query optimization
- Frontend performance improvements
- Caching strategies

**Files to modify:**

- Various group-related files for optimization

**Acceptance Criteria:**

- Efficient database queries with proper joins
- Frontend caching for group data
- Optimistic updates for better UX
- Lazy loading where appropriate

**Definition of Done:**

- Group operations perform well under load
- Good user experience with fast responses
- Scalable architecture for growth

---

## Task Dependencies Chart

```
Task 1 (Database Schema) 
├── Task 2 (Personal Groups)
├── Task 3 (Group CRUD)
│   ├── Task 4 (Invite Codes)
│   ├── Task 6 (Group Store)
│   └── Task 11 (Member Management)
│       └── Task 14 (Management Page)
└── Task 9 (Shopping List Integration)

Task 5 (Anonymous Guards) ── Task 7 (Group Interface)
                            ├── Task 8 (Join Dialog)
                            └── Task 10 (Navigation)

Task 4 (Invite Codes) ── Task 12 (Invite Links) ── Task 13 (Landing Page)

Task 9 + Task 10 ── Task 15 (Shopping List UI)

Task 2 + Task 9 ── Task 16 (Data Migration)

All Tasks ── Task 17 (Testing) ── Task 18 (Performance)
```

## Implementation Priority

**Phase 1 (Core Foundation):**

- Task 1: Database Schema Foundation
- Task 2: Personal Group Auto-Creation  
- Task 3: Basic Group CRUD Operations
- Task 5: Anonymous User Guards

**Phase 2 (Basic Group Functionality):**

- Task 4: Invite Code System
- Task 6: Group Store and State Management
- Task 7: Basic Group Interface Component
- Task 9: Shopping List Group Integration

**Phase 3 (User Experience):**

- Task 8: Join Group Dialog and Flow
- Task 10: Navigation Integration
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

---

## Database Schema Details

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
  members     GroupMember[]
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
  groupMemberShips    GroupMember[]
  personalGroupId     String?  // Reference to personal group
  personalGroup       Group?   @relation("PersonalGroup", fields: [personalGroupId], references: [id])
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

## API Endpoints Overview

### Group Router (`/api/trpc/group.*`)

- `POST /createGroup` - Create new group (authenticated users only)
- `GET /getMyGroups` - Get user's groups (excluding personal if only group)
- `GET /getGroupDetails` - Get group with members
- `PUT /updateGroup` - Update group (admin only)
- `DELETE /deleteGroup` - Delete group (admin only)
- `POST /leaveGroup` - Leave group
- `POST /generateInviteCode` - Generate new invite code
- `GET /generateInviteLink` - Generate shareable invite link
- `POST /joinViaCode` - Join group using invite code
- `POST /joinViaLink` - Join group using invite link token
- `POST /validateInviteCode` - Validate invite code
- `GET /validateInviteLink` - Validate invite link

### Group Member Router (`/api/trpc/groupMember.*`)

- `DELETE /removeMember` - Remove member (admin only)
- `PUT /updateRole` - Change member role (admin only)
- `GET /getMembers` - Get group members

### Updated Shopping List Router (`/api/trpc/shoppingList.*`)

All existing endpoints updated to include `groupId` parameter (auto-resolved to personal group if user has only one):

- `GET /getItems?groupId=xxx`
- `POST /addItem` (with groupId)
- `PUT /updateItem` (with groupId verification)
- `DELETE /deleteItem` (with groupId verification)
- `POST /executeActions` (with groupId)

---

## UI/UX Considerations

### Combined Group Interface

**For users with only personal group:**

- Show "Create Group" button
- Show "Join Group" button
- No group selector dropdown
- Clean, simple interface

**For users with multiple groups:**

- Group selector dropdown showing all groups
- "Create Group" option in dropdown
- "Join Group" option in dropdown
- Current group clearly indicated

**For anonymous users:**

- Disabled "Create Group" and "Join Group" buttons
- Tooltip: "Sign up to create or join groups"
- Clear sign-up call-to-action

### Group Creation Flow

- Simple modal with group name and description
- Auto-generate invite code
- Show invite code and shareable link immediately
- Copy-to-clipboard functionality

### Group Joining Flow

**Via Code:**

- Input field for group code
- Instant validation feedback
- Group preview before joining

**Via Link:**

- Direct link access: `/join-group/[token]`
- Group information display
- Login prompt if anonymous
- One-click join for authenticated users

### Shopping List Interface

**Personal Group Only:**

- No group name shown in header
- Standard shopping list interface
- No group-related UI elements

**Multiple Groups:**

- Group name prominently displayed
- Group switching via navigation
- "Added by [Name]" attribution on items
- Real-time updates with user indicators

### Mobile Responsiveness

- Touch-friendly group interface
- Responsive join group dialogs
- Mobile-optimized group switching
- Easy invite link sharing on mobile

---

## Security Considerations

### Authorization

- Group membership verified on all operations
- Admin-only operations properly protected
- Invite codes have reasonable expiration
- Personal groups cannot be deleted

### Anonymous User Protection

- All group operations require authentication
- Clear messaging for anonymous users
- Secure redirect flow after login
- No sensitive group information exposed

### Invite System Security

- Invite codes are unique and unpredictable
- Rate limiting on code generation
- Invite links have secure tokens
- Join operations properly validated

### Data Privacy

- Users only see groups they belong to
- Shopping lists isolated by group
- Personal groups remain private
- Audit trail for group actions

---

## Performance Optimizations

### Database

- Proper indexing on invite codes and foreign keys
- Efficient queries with joins
- Personal group detection optimized
- Caching frequently accessed group data

### Frontend

- Group data cached in Zustand store
- Optimistic updates for better UX
- Lazy loading of group member details
- Smart personal group handling

### API

- Batch operations where possible
- Efficient TRPC queries with proper select
- Response caching for static group data
- Personal group context optimization

---

## Testing Strategy

### Unit Tests

- All TRPC route handlers
- Group business logic functions
- React hooks for group operations
- Anonymous user guard functions
- Personal group detection logic

### Integration Tests

- Group creation and joining flows
- Invite code and link generation
- Shopping list operations within groups
- Personal group behavior
- Anonymous user restrictions

### E2E Tests

- Complete user workflows
- Group creation and joining via codes/links
- Multi-user shopping list collaboration
- Personal group vs multi-group experiences
- Anonymous user experience

---

## Deployment Considerations

### Database Migration

- Run migration in staging first
- Create personal groups for existing users
- Plan for zero-downtime migration
- Backup strategy before migration
- Rollback plan if needed

### Feature Flags

- Gradual rollout to users
- A/B testing for new UI
- Quick disable if issues found
- Monitoring and alerts

### Monitoring

- Group usage analytics
- Join success rates (codes vs links)
- Personal group vs multi-group usage
- Anonymous user conversion rates
- Performance metrics and error tracking

---

## Future Enhancements

### Phase 2 Features

- Temporary invite links with expiration
- Group templates/categories
- Advanced member permissions
- Shopping list templates

### Advanced Features

- Recurring shopping lists
- Shopping history and analytics
- Budget tracking per group
- Location-based notifications

### Collaboration Features

- Comments on shopping list items
- Item assignment to specific members
- Shopping trip coordination
- Voice note support
