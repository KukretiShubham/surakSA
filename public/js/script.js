const menuBtn = document.querySelector(".img");
      const navbar = document.querySelector(".navbar");
      let menuOpen = false;
      let navlist = document.querySelector("#nav-list");
      menuBtn.addEventListener("click", () => {
        navlist.classList.toggle("v-class");
        navbar.classList.toggle("h-nav");
        if (!menuOpen) {
          menuBtn.classList.add("open");
          menuOpen = true;
        } else {
          menuBtn.classList.remove("open");
          menuOpen = false;
        }
      });

      