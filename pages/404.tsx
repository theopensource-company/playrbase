import Link from 'next/link'
import React from 'react';
import { Button } from '../components/Button';
import stylesPublic from '../styles/pages/404.module.scss';

export default function FourOhFour() {
  return <div className={stylesPublic.default}>
    <div className="text">
        <h1>Oh no | <span>404</span></h1>
        <h2>This page could not be found.</h2>
    </div>
    <div>
        <Button>
            Go back to the home page
        </Button>
    </div>
  </div>
}