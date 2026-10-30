// The admin pages, as one lazy chunk (`adminPage` in app/routes.tsx): one
// dynamic import in `/`'s route table for all of them (each `import()`
// there costs `/` its preload list and file names), and moving between
// admin pages downloads nothing more. Add slice 20's pages here.

export { default as ManageUsersPage } from "../admin-users/ManageUsersPage"
export { default as ManageSupportPage } from "../admin-requests/ManageSupportPage"
