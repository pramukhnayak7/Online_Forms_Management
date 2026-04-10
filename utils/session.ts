export function getUserSession() {
    if (typeof window === "undefined") return null;

    const data = localStorage.getItem("formdb_user");
    return data ? JSON.parse(data) : null;
}