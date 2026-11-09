import { Route, Routes } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import Home from './pages/Home.jsx';
import FrpPools from './pages/FrpPools.jsx';
import PumpsFiltration from './pages/PumpsFiltration.jsx';
import Products from './pages/Products.jsx';
import About from './pages/About.jsx';
import Contact from './pages/Contact.jsx';
import { BlogList, BlogPost } from './pages/Blog.jsx';
import { ProjectDetail, ProjectList } from './pages/Projects.jsx';
import NotFound from './pages/NotFound.jsx';

// All pages ship in one small bundle: no extra round-trip when someone lands
// directly on an inner page, and instant navigation afterwards.
export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="frp-pools" element={<FrpPools />} />
        <Route path="pumps-filtration" element={<PumpsFiltration />} />
        <Route path="products" element={<Products />} />
        <Route path="about" element={<About />} />
        <Route path="contact" element={<Contact />} />
        <Route path="blog" element={<BlogList />} />
        <Route path="blog/:slug" element={<BlogPost />} />
        <Route path="projects" element={<ProjectList />} />
        <Route path="projects/:slug" element={<ProjectDetail />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
