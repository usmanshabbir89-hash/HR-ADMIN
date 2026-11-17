// Layout - the frame around every page: sidebar on the left, top bar, and
// the current page in the middle (<Outlet /> is where the page appears).
import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { Briefcase, Menu, X } from "lucide-react";

import { ALL_LINKS, NAV_SECTIONS } from "../navigation.js";

export default function Layout() {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false); // used on small screens only

  // Find the label of the current page for the top bar
  const current = ALL_LINKS.find((link) => link.path === location.pathname);
  const pageTitle = current ? current.label : "Page not found";

  // Close the mobile menu whenever the page changes, and update the browser tab title
  useEffect(() => {
    setMenuOpen(false);
    document.title = `${pageTitle} · HR Admin`;
  }, [location.pathname, pageTitle]);

  return (
    <div className="app">
      <aside className={`sidebar ${menuOpen ? "open" : ""}`}>
        <div className="brand">
          <div className="brand-logo">
            <Briefcase size={18} />
          </div>
          <div>
            <div className="brand-name">HR Admin</div>
            <div className="brand-sub">Management System</div>
          </div>
        </div>

        <nav>
          {NAV_SECTIONS.map((section) => (
            <div key={section.title} className="nav-section">
              <div className="nav-title">{section.title}</div>
              {section.links.map(({ path, label, icon: Icon }) => (
                // NavLink adds the "active" class when this is the current page
                <NavLink key={path} to={path} end className="nav-link">
                  <Icon size={18} />
                  {label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
      </aside>

      {/* Dark overlay behind the menu on phones; tap it to close the menu */}
      {menuOpen && <div className="sidebar-overlay" onClick={() => setMenuOpen(false)} />}

      <div className="main">
        <header className="topbar">
          <button
            className="icon-button menu-button"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <h1>{pageTitle}</h1>
          <div className="topbar-user">
            <div className="avatar">HR</div>
            <span>HR Admin</span>
          </div>
        </header>

        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
