
(function () {
    document.addEventListener("DOMContentLoaded", function () {
        const authLink = document.getElementById("auth-link");
        const profileMenu = document.getElementById("profile-menu");
        const profileImg = document.getElementById("profile-img");
        const profileName = document.getElementById("profile-name");
        const dropdownMenu = document.getElementById("dropdown-menu");
        const logoutBtn = document.getElementById("logout-btn");
        const fileUpload = document.getElementById("file-upload");
        const editNameInput = document.getElementById("edit-name");
        const saveNameBtn = document.getElementById("save-name-btn");

        const userId = localStorage.getItem("userId");
        const token = localStorage.getItem("token");

        if (userId && token) {
            fetch('http://localhost:3000/profile', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    authLink.style.display = "none";
                    profileMenu.style.display = "flex";
                    profileName.innerText = data.user.name;
                    profileImg.src = data.user.profileImage || "default-avatar.png";
                }
            })
            .catch(error => console.error('Error fetching profile:', error));
        } else {
            authLink.style.display = "block";
            profileMenu.style.display = "none";
        }

        profileMenu.addEventListener("click", function (event) {
            event.stopPropagation();
            dropdownMenu.style.display = dropdownMenu.style.display === "block" ? "none" : "block";
        });

        logoutBtn.addEventListener("click", function () {
            localStorage.removeItem("userId");
            localStorage.removeItem("token");
            alert("You have been logged out!");
            window.location.reload();
        });

        saveNameBtn.addEventListener("click", function (event) {
            event.stopPropagation();
            const newName = editNameInput.value.trim();
            if (newName) {
                profileName.innerText = newName;
                alert("Profile name updated!");
            }
        });

        fileUpload.addEventListener("change", function () {
            const file = this.files[0];
            if (file) {
                const formData = new FormData();
                formData.append('image', file);

                fetch('http://localhost:3000/profile/image', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    body: formData
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        profileImg.src = data.profileImage;
                        alert("Profile image updated!");
                    }
                })
                .catch(error => console.error('Error uploading image:', error));
            }
        });

        document.addEventListener("click", function (event) {
            if (!profileMenu.contains(event.target) && !dropdownMenu.contains(event.target)) {
                dropdownMenu.style.display = "none";
            }
        });

        dropdownMenu.addEventListener("click", function (event) {
            event.stopPropagation();
        });
    });
})();