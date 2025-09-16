"use client";
import React, { useState, useEffect } from "react";
import ParentLayout from "../../../components/Layouts/ParentLayout";
import SessionChecker from "../../../components/Session/SessionChecker";
import UserFetcher from "../../../components/User/UserFetcher";

// Components
import AddPostForm from "../../../components/Companies/CompanyAccounts/Form";
import Table from "../../../components/Agents/DeletionCompanies/Table";
import Pagination from "../../../components/UserManagement/CompanyAccounts/Pagination";

// Toast Notifications
import { ToastContainer, toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';

const ListofUser: React.FC = () => {
    const [showForm, setShowForm] = useState(false);
    const [showImportForm, setShowImportForm] = useState(false);
    const [editUser, setEditUser] = useState<any>(null);
    const [posts, setPosts] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [postsPerPage, setPostsPerPage] = useState(12);
    const [selectedClientType, setSelectedClientType] = useState("");
    const [startDate, setStartDate] = useState(""); // Default to null
    const [endDate, setEndDate] = useState(""); // Default to null

    const [userDetails, setUserDetails] = useState({
        UserId: "", ReferenceID: "", Manager: "", TSM: "", Firstname: "", Lastname: "", Email: "", Role: "", Department: "", Company: "",
    });

    const [referenceid, setReferenceID] = useState("");
    const [manager, setManager] = useState("");
    const [tsm, setTsm] = useState("");

    // Loading states
    const [error, setError] = useState<string | null>(null);
    const [loadingUser, setLoadingUser] = useState<boolean>(true);

    const loading = loadingUser; // 🔑 combined state

    // Fetch user data based on query parameters (user ID)
    useEffect(() => {
        const fetchUserData = async () => {
            const params = new URLSearchParams(window.location.search);
            const userId = params.get("id");

            if (userId) {
                try {
                    const response = await fetch(`/api/user?id=${encodeURIComponent(userId)}`);
                    if (!response.ok) throw new Error("Failed to fetch user data");
                    const data = await response.json();
                    setUserDetails({
                        UserId: data._id, // Set the user's id here
                        ReferenceID: data.ReferenceID || "",
                        Manager: data.Manager || "",
                        TSM: data.TSM || "",
                        Firstname: data.Firstname || "",
                        Lastname: data.Lastname || "",
                        Email: data.Email || "",
                        Role: data.Role || "",
                        Department: data.Department || "",
                        Company: data.Company || "",
                    });
                    setReferenceID(data.ReferenceID || "");
                    setManager(data.Manager || "");
                    setTsm(data.TSM || "");
                } catch (err: unknown) {
                    console.error("Error fetching user data:", err);
                    setError("Failed to load user data. Please try again later.");
                } finally {
                    setLoadingUser(false);
                }
            } else {
                setError("User ID is missing.");
                setLoadingUser(false);
            }
        };

        fetchUserData();
    }, []);

    // Fetch all users from the API
    const fetchAccount = async () => {
        try {
            const response = await fetch("/api/ModuleSales/UserManagement/CompanyAccounts/FetchAccount");
            const data = await response.json();
            console.log("Fetched data:", data); // Debugging line
            setPosts(data.data); // Make sure you're setting `data.data` if API response has `{ success: true, data: [...] }`
        } catch (error) {
            toast.error("Error fetching users.");
            console.error("Error Fetching", error);
        }
    };

    useEffect(() => {
        fetchAccount();
    }, []);


    // Filter users by search term (firstname, lastname)
    const filteredAccounts = Array.isArray(posts)
        ? posts.filter((post) => {
            // Check if the company name matches the search term
            const matchesSearchTerm = post?.companyname?.toLowerCase().includes(searchTerm.toLowerCase());

            // Parse the date_created field
            const postDate = post.date_created ? new Date(post.date_created) : null;

            // Check if the post's date is within the selected date range
            const isWithinDateRange = (
                (!startDate || (postDate && postDate >= new Date(startDate))) &&
                (!endDate || (postDate && postDate <= new Date(endDate)))
            );

            // Check if the post matches the selected client type
            const matchesClientType = selectedClientType
                ? post?.typeclient === selectedClientType
                : true;

            // Get the reference ID from userDetails
            const referenceID = userDetails.ReferenceID; // Manager's ReferenceID from MongoDB

            const matchesRole = userDetails.Role === "Super Admin" || userDetails.Role === "Special Access"
                ? true // Super Admin sees all
                : userDetails.Role === "Territory Sales Associate"
                    ? post?.referenceid === referenceID // Manager sees only assigned companies
                    : userDetails.Role === "Manager"
                        ? post?.manager === referenceID
                        : userDetails.Role === "Territory Sales Manager"
                            ? post?.tsm === referenceID
                            : false; // Default false if no match

            // Check if the status is 'Inactive' and if the filters match
            const matchesStatus = post?.status === "For Deletion" || post?.status === "Remove" || post?.status === "Approve For Deletion";

            // Return the filtered result, ensuring 'Inactive' status is considered
            return matchesSearchTerm && isWithinDateRange && matchesClientType && matchesRole && matchesStatus;
        })
        : [];

    const indexOfLastPost = currentPage * postsPerPage;
    const indexOfFirstPost = indexOfLastPost - postsPerPage;
    const currentPosts = filteredAccounts.slice(indexOfFirstPost, indexOfLastPost);
    const totalPages = Math.ceil(filteredAccounts.length / postsPerPage);


    // Handle editing a post
    const handleEdit = (post: any) => {
        setEditUser(post);
        setShowForm(true);
    };


    return (
        <SessionChecker>
            <ParentLayout>
                <UserFetcher>
                    {(user) => (
                        <div className="mx-auto p-4 text-gray-900">
                            <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-1">
                                {showForm ? (
                                    <AddPostForm
                                        onCancel={() => {
                                            setShowForm(false);
                                            setEditUser(null);
                                        }}
                                        refreshPosts={fetchAccount} // Pass the refreshPosts callback
                                        userDetails={{
                                            id: editUser ? editUser.id : userDetails.UserId,
                                            referenceid: editUser ? editUser.referenceid : userDetails.ReferenceID,
                                            manager: editUser ? editUser.manager : userDetails.Manager,
                                            tsm: editUser ? editUser.tsm : userDetails.TSM,
                                        }}
                                        editUser={editUser}
                                    />

                                ) : (
                                    <>
                                        <div className="mb-4 p-4 bg-white shadow-md rounded-lg">
                                            <h2 className="text-lg font-bold mb-2">Deletion Companies</h2>
                                            <p className="text-xs text-gray-600 mb-4">
                                                This section displays a list of <strong>Deletion Companies</strong> within the system. You can filter the companies based on various criteria such as client type, start date, end date, and search term. Use the filters to narrow down your search and quickly find the relevant inactive companies you need to manage or review.
                                            </p>
                                            {/* Loader or Table */}
                                            {loading ? (
                                                <div className="flex justify-center items-center py-10">
                                                    <div className="w-6 h-6 border-2 border-gray-300 border-t-orange-500 rounded-full animate-spin"></div>
                                                    <span className="ml-2 text-xs text-gray-500">Loading data...</span>
                                                </div>
                                            ) : (
                                                <>
                                                    <Table
                                                        posts={currentPosts}
                                                        handleEdit={handleEdit}
                                                        referenceid={referenceid}
                                                    />
                                                </>
                                            )}
                                            <Pagination
                                                currentPage={currentPage}
                                                totalPages={totalPages}
                                                setCurrentPage={setCurrentPage}
                                            />


                                            <div className="text-xs mt-2">
                                                Showing {indexOfFirstPost + 1} to{" "}
                                                {Math.min(indexOfLastPost, filteredAccounts.length)} of{" "}
                                                {filteredAccounts.length} entries
                                            </div>
                                        </div>
                                    </>
                                )}

                                <ToastContainer className="text-xs" autoClose={1000} />
                            </div>
                        </div>
                    )}
                </UserFetcher>
            </ParentLayout>
        </SessionChecker>
    );
};

export default ListofUser;
